import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getDevHost() {
  const configuredApiHost = Constants.expoConfig?.extra?.apiHost;
  if (configuredApiHost) {
    return configuredApiHost.replace(/\/$/, '');
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    return `http://${hostUri.split(':')[0]}:8000`;
  }

  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:8000`;
}

export const API_HOST = getDevHost();
export const BASE = `${API_HOST}/api`;

export default {
  API_HOST,
  BASE,
};
