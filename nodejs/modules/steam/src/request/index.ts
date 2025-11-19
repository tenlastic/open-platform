import axios from 'axios';

export interface RequestOptions<T> {
  method: 'get';
  params?: T;
  url: string;
}

export interface RequestResponse<T> {
  data: T;
  status: number;
}

export async function request<TRequest, TResponse>(
  options: RequestOptions<TRequest>,
): Promise<RequestResponse<TResponse>> {
  const { method, params, url } = options;

  const response = await axios.request({ method, params, url, validateStatus });

  return { data: response.data, status: response.status };
}

function validateStatus() {
  return true;
}
