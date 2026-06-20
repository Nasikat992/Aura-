import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { getCategoryIcon, getCategoryLabel } from '../constants/wardrobe';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

async function fetchAllPages(url) {
  let nextUrl = url;
  let results = [];

  while (nextUrl) {
    const response = await api.get(nextUrl);
    if (Array.isArray(response)) {
      results = [...results, ...response];
      break;
    }

    results = [...results, ...(response.results ?? [])];
    if (!response.next) break;

    const next = new URL(response.next);
    nextUrl = `${next.pathname.replace('/api', '')}${next.search}`;
  }

  return results;
}

export default function AIGeneratePage() {
  const toast = useToast();
  const { profile } = useAuth();
  const faceInputRef = useRef();
  
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [loadingWardrobe, setLoadingWardrobe] = useState(true);
  const [faceFile, setFaceFile] = useState(null);
  const [facePreview, setFacePreview] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  const selectedItems = wardrobeItems.filter(item => selectedItemIds.includes(item.id));

  useEffect(() => {
    const loadWardrobeItems = async () => {
      setLoadingWardrobe(true);
      try {
        const [wardrobe, accessories] = await Promise.all([
          fetchAllPages('/wardrobe/?kind=wardrobe'),
          fetchAllPages('/wardrobe/?kind=accessories'),
        ]);
        setWardrobeItems([...wardrobe, ...accessories]);
      } catch (error) {
        toast(error.message, 'error');
      } finally {
        setLoadingWardrobe(false);
      }
    };

    loadWardrobeItems();
  }, [toast]);

  useEffect(() => {
    if (!faceFile) {
      setFacePreview('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(faceFile);
    setFacePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [faceFile]);

  useEffect(() => {
    const validIds = new Set(wardrobeItems.map(item => item.id));
    setSelectedItemIds(prev => prev.filter(id => validIds.has(id)));
  }, [wardrobeItems]);

  const togglePreviewItem = itemId => {
    setSelectedItemIds(prev => (
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    ));
  };

  const generateOutfitPreview = async () => {
    if (!profile?.gender) {
      toast('Укажи пол в профиле, чтобы AI-примерка была точнее.', 'error');
      return;
    }
    if (!faceFile) {
      toast('Загрузи фото лица для AI-примерки.', 'error');
      return;
    }
    if (!selectedItems.length) {
      toast('Выбери хотя бы одну вещь для AI-примерки.', 'error');
      return;
    }

    setGeneratingPreview(true);
    setGeneratedImage(null);
    try {
      const genderMap = {
        woman: 'woman',
        man: 'man',
        non_binary: 'person',
        prefer_not_to_say: 'person'
      };
      const genderWord = genderMap[profile?.gender] || 'person';

      const clothesList = selectedItems.map(item => {
        const details = [];
        if (item.brand) details.push(`brand: ${item.brand}`);
        if (item.color) details.push(`color: ${item.color}`);
        if (item.category) details.push(`category: ${getCategoryLabel(item.category) || item.category}`);
        if (item.notes) details.push(`style/notes: ${item.notes}`);
        return `- A ${item.color || ''} ${getCategoryLabel(item.category) || 'clothing item'} named "${item.name}" (${details.join(', ')})`;
      }).join('\n');

      const generatedPromptText = `A hyper-realistic, professional, high-fashion full-body portrait photograph of a ${genderWord} standing and posing for a premium clothing lookbook.
The subject's face MUST be identical in features, identity, expression, shape, and skin tone to the face reference image.
The subject is wearing a cohesive and stylish outfit consisting of the following specific wardrobe items reproduced from the clothing reference images:
${clothesList}

STRICT INSTRUCTIONS:
1. FULL BODY SHOT: Show the complete outfit from head to toe. The model should have a natural, confident posture.
2. GENDER INTEGRITY: The model's body structure and proportions must be that of a ${genderWord}.
3. FACE FUSION: Flawlessly blend the user's face from the input image onto the subject. The facial features, gaze, hair, and look must match the face reference photo with absolute realism.
4. CLOTHING FAITHFULNESS: Every clothing item from the reference images must be rendered with high precision—matching its exact color, shape, fit, textile texture, and visual details. They must look like real fabric (denim, wool, cotton, leather).
5. CINEMATIC QUALITY: Ultra-detailed 8K resolution, photorealistic fashion editorial style, soft studio lighting, sharp focus, clear textures, and a clean minimalist solid neutral studio background.`;

      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
      
      const faceBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          const base64 = result.split(',')[1] || result;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(faceFile);
      });

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent`;
      
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: generatedPromptText },
              {
                inlineData: {
                  mimeType: faceFile.type || "image/jpeg",
                  data: faceBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ["Image"],
          responseFormat: {
            image: {
              aspectRatio: "ASPECT_RATIO_THREE_BY_FOUR"
            }
          }
        }
      };

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const resJson = await response.json();
      const candidate = resJson.candidates?.[0];
      const part = candidate?.content?.parts?.[0];
      const inlineData = part?.inlineData || part?.inline_data;
      if (!inlineData || !inlineData.data) {
        throw new Error("Gemini did not return any image candidates");
      }

      const generatedBase64 = inlineData.data;
      const generatedMimeType = inlineData.mimeType || inlineData.mime_type || "image/png";

      const byteCharacters = atob(generatedBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const generatedBlob = new Blob([byteArray], { type: generatedMimeType });
      const imageUrl = URL.createObjectURL(generatedBlob);

      setGeneratedImage(imageUrl);
      toast('AI-примерка готова', 'success');
    } catch (error) {
      toast(error.message || 'Ошибка генерации', 'error');
    } finally {
      setGeneratingPreview(false);
    }
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="page-tag">AI Примерка</div>
        <h1 className="page-title">Создай <em>свой образ</em></h1>
        <p className="page-subtitle">Выбери вещи из гардероба и добавь своё фото, чтобы увидеть, как это будет смотреться на тебе.</p>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div className="outfit-preview-composer">
          <div className="flex-between" style={{ gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <div className="section-title" style={{ fontSize: 18, marginBottom: 4 }}>Параметры примерки</div>
              <div className="text-muted" style={{ fontSize: 13 }}>
                Фото лица + вещи из гардероба: {selectedItemIds.length} выбрано
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={generateOutfitPreview}
              disabled={generatingPreview || loadingWardrobe}
            >
              {generatingPreview ? <><span className="spinner" /> Генерирую...</> : 'Сгенерировать'}
            </button>
          </div>

          <div className="outfit-preview-grid" style={{ gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'start' }}>
            <div className="face-upload-box" style={{ width: 140, height: 180 }}>
              <input
                type="file"
                accept="image/*"
                ref={faceInputRef}
                style={{ display: 'none' }}
                onChange={event => setFaceFile(event.target.files[0] || null)}
              />
              <button
                type="button"
                className="face-upload-button"
                onClick={() => faceInputRef.current.click()}
                style={{ width: '100%', height: '100%' }}
              >
                {facePreview ? (
                  <img src={facePreview} alt="Фото лица" style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: 8 }} />
                ) : (
                  <span>Загрузить фото лица</span>
                )}
              </button>
              <div className="text-muted" style={{ fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                {faceFile ? faceFile.name : profile?.gender ? `Профиль: ${profile.gender}` : 'Укажи пол в профиле'}
              </div>
            </div>

            <div className="preview-item-panel" style={{ flex: 1 }}>
              {loadingWardrobe ? (
                <div className="text-muted" style={{ fontSize: 14 }}>Загружаем гардероб...</div>
              ) : wardrobeItems.length === 0 ? (
                <div className="text-muted" style={{ fontSize: 14 }}>Добавь вещи в гардероб, чтобы собрать примерку.</div>
              ) : (
                <div className="preview-item-scroll" style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {wardrobeItems.map(item => {
                    const selected = selectedItemIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`preview-select-card ${selected ? 'selected' : ''}`}
                        onClick={() => togglePreviewItem(item.id)}
                        title={item.image_url ? item.name : 'Для примерки нужно фото вещи'}
                      >
                        <div className="preview-select-media">
                          {item.image_url ? <img src={item.image_url} alt={item.name} /> : <span>{getCategoryIcon(item.category)}</span>}
                        </div>
                        <div className="preview-select-title">{item.name}</div>
                        <div className="preview-select-meta">{getCategoryLabel(item.category)}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="preview-chip-list" style={{ marginTop: 16 }}>
                {selectedItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className="look-chip look-chip-remove"
                    onClick={() => togglePreviewItem(item.id)}
                  >
                    {getCategoryIcon(item.category)} {item.name} ×
                  </button>
                ))}
                {selectedItems.length === 0 && <span className="text-muted" style={{ fontSize: 13 }}>Выбранные вещи появятся здесь.</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {generatedImage && (
        <div className="card" style={{ marginTop: 24, padding: 24, textAlign: 'center' }}>
          <h3 className="section-title" style={{ marginBottom: 16 }}>Результат примерки</h3>
          <img 
            src={generatedImage} 
            alt="Сгенерированный образ" 
            style={{ maxWidth: '100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
          />
        </div>
      )}
    </div>
  );
}
