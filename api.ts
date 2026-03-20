import axios from "axios";

// Your PC's local IP on the WiFi network.
// To find it: run `ipconfig` in cmd → look for "IPv4 Address" under your WiFi adapter.
// Update this if your IP changes (it can change when you reconnect to WiFi).
export const API_BASE_URL = "http://192.168.1.143:5000";

export interface PredictAgeResponse {
  faces_found: number;
  ages: number[];
  message: string;
}

export async function predictAge(
  imageUri: string,
  fileName: string,
  mimeType: string
): Promise<PredictAgeResponse> {
  const formData = new FormData();

  // React Native / Expo FormData accepts an object with uri/name/type
  formData.append("file", {
    uri: imageUri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  const response = await axios.post<PredictAgeResponse>(
    `${API_BASE_URL}/predict-age`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000,
    }
  );

  return response.data;
}
