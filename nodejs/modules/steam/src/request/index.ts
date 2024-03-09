import axios from 'axios';

export interface RequestOptions {
  method: 'get';
  params?: any;
  url: string;
}

export interface RequestResponse<T> {
  data: T;
  status: number;
}

export async function request<T>(options: RequestOptions): Promise<RequestResponse<T>> {
  const { method, params, url } = options;

  const response = await axios({ method, params, url, validateStatus });

  return { data: response.data, status: response.status };
}

function validateStatus() {
  return true;
}
