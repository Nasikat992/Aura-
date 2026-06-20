import base64
import json
import os
import shutil
import tempfile
from io import BytesIO
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework.test import APITestCase

from stylist.models import ChatMessage, ChatSession, WardrobeItem


def image_upload(name='test.png', color='white'):
    buffer = BytesIO()
    Image.new('RGB', (16, 16), color=color).save(buffer, format='PNG')
    return SimpleUploadedFile(name, buffer.getvalue(), content_type='image/png')


class MockGeminiResponse:
    def __init__(self, body):
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def read(self):
        return json.dumps(self.body).encode('utf-8')


class OutfitPreviewTests(APITestCase):
    def setUp(self):
        self.media_dir = tempfile.mkdtemp()
        self.override = override_settings(MEDIA_ROOT=self.media_dir)
        self.override.enable()
        self.addCleanup(self.override.disable)
        self.addCleanup(lambda: shutil.rmtree(self.media_dir, ignore_errors=True))

        self.user = User.objects.create_user(username='stylist', password='pass')
        self.user.profile.gender = 'woman'
        self.user.profile.save()
        self.session = ChatSession.objects.create(user=self.user, title='Preview')
        self.item = WardrobeItem.objects.create(
            user=self.user,
            name='White T-shirt',
            category='tshirt',
            color='white',
            image=image_upload('shirt.png'),
        )
        self.client.force_authenticate(self.user)
        self.url = f'/api/chat-sessions/{self.session.id}/outfit-preview/'

    def payload(self, item_ids=None, face=True):
        data = {'item_ids': json.dumps(item_ids if item_ids is not None else [self.item.id])}
        if face:
            data['face_image'] = image_upload('face.png', color='pink')
        return data

    def test_requires_profile_gender(self):
        self.user.profile.gender = ''
        self.user.profile.save()

        response = self.client.post(self.url, self.payload(), format='multipart')

        self.assertEqual(response.status_code, 400)
        self.assertIn('пол', response.data['detail'])

    def test_requires_face_image(self):
        response = self.client.post(self.url, self.payload(face=False), format='multipart')

        self.assertEqual(response.status_code, 400)
        self.assertIn('фото лица', response.data['detail'].lower())

    def test_requires_selected_items(self):
        response = self.client.post(self.url, self.payload(item_ids=[]), format='multipart')

        self.assertEqual(response.status_code, 400)
        self.assertIn('хотя бы одну', response.data['detail'])

    def test_rejects_item_without_image(self):
        item = WardrobeItem.objects.create(
            user=self.user,
            name='Blue jeans',
            category='jeans_full',
            color='blue',
        )

        response = self.client.post(self.url, self.payload(item_ids=[item.id]), format='multipart')

        self.assertEqual(response.status_code, 400)
        self.assertIn('должны быть фото', response.data['detail'])

    def test_rejects_other_users_item(self):
        other = User.objects.create_user(username='other')
        item = WardrobeItem.objects.create(
            user=other,
            name='Sneakers',
            category='sneakers',
            image=image_upload('sneakers.png'),
        )

        response = self.client.post(self.url, self.payload(item_ids=[item.id]), format='multipart')

        self.assertEqual(response.status_code, 400)
        self.assertIn('недоступны', response.data['detail'])

    @patch.dict(os.environ, {'GEMINI_API_KEY': ''})
    def test_requires_gemini_api_key(self):
        response = self.client.post(self.url, self.payload(), format='multipart')

        self.assertEqual(response.status_code, 503)
        self.assertEqual(ChatMessage.objects.count(), 0)
        self.assertIn('GEMINI_API_KEY', response.data['detail'])

    @patch.dict(os.environ, {'GEMINI_API_KEY': 'test-key', 'GEMINI_IMAGE_MODEL': 'gemini-3-pro-image'})
    @patch('stylist.views.urllib_request.urlopen')
    def test_creates_chat_messages_with_generated_image(self, urlopen):
        generated_png = base64.b64encode(image_upload('generated.png').read()).decode('ascii')
        urlopen.return_value = MockGeminiResponse(
            {
                'candidates': [
                    {
                        'content': {
                            'parts': [
                                {'inlineData': {'mimeType': 'image/png', 'data': generated_png}},
                            ],
                        },
                    },
                ],
            }
        )

        response = self.client.post(self.url, self.payload(), format='multipart')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(ChatMessage.objects.count(), 2)
        assistant = response.data['messages'][1]
        self.assertEqual(assistant['role'], 'assistant')
        self.assertTrue(assistant['image_url'])
        self.assertEqual(assistant['metadata']['type'], 'outfit_preview')
