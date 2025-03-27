import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';
import type { Dog, Owner, Walker, Walk, Assessment } from '../types';
import { getCurrentUser } from '../auth';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'max-age=300' // 5 min cache
  }
});

// Add request interceptor to include user information in headers
api.interceptors.request.use((config) => {
  const user = getCurrentUser();
  console.log('API Request - Current User:', user); // Debug output
  
  if (user) {
    config.headers['user-id'] = user.id;
    config.headers['user-role'] = user.role;
    if (user.profileId) {
      config.headers['user-profile-id'] = user.profileId;
      console.log('Setting profile ID header:', user.profileId); // Debug output
    } else {
      console.log('No profile ID available for user:', user.id); // Debug output
    }
  } else {
    console.log('No user found for API request'); // Debug output
  }
  
  return config;
});

// Add request/response interceptors for consistent error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    console.error('API error:', error);
    return Promise.reject(error);
  }
);

export const DogAPI = {
  getAll: () => api.get('/data/dogs').then(res => res.data),
  getAllData: () => api.get('/data/all').then((res: AxiosResponse) => res.data),
  getById: (id: string) => api.get(`/data/dogs/${id}`).then(res => res.data),
  getByOwnerId: (ownerId: string) => api.get(`/data/owners/${ownerId}/dogs`).then(res => res.data),
  create: (data: Omit<Dog, 'id'>) => api.post('/data/dogs', data).then(res => res.data),
  update: (id: string, data: Partial<Dog>) => api.patch(`/data/dogs/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/data/dogs/${id}`).then(res => res.data),
};

export const OwnerAPI = {
  getAll: () => api.get('/data/owners').then((res: AxiosResponse) => res.data),
  getById: (id: string) => api.get(`/data/owners/${id}`).then((res: AxiosResponse) => res.data),
  create: (owner: Omit<Owner, 'id'>) => api.post('/data/owners', owner).then((res: AxiosResponse) => res.data),
  update: (id: string, owner: Partial<Owner>) => api.patch(`/data/owners/${id}`, owner).then((res: AxiosResponse) => res.data),
  delete: (id: string) => api.delete(`/data/owners/${id}`).then((res: AxiosResponse) => res.data),
  ensure: (userId: string, data: any) => api.post('/data/owners/ensure', { userId, ...data }).then((res: AxiosResponse) => res.data)
};

export const WalkerAPI = {
  getAll: () => api.get('/data/walkers').then((res: AxiosResponse) => res.data),
  getById: (id: string) => api.get(`/data/walkers/${id}`).then((res: AxiosResponse) => res.data),
  create: (walker: Omit<Walker, 'id'>) => api.post('/data/walkers', walker).then((res: AxiosResponse) => res.data),
  update: (id: string, walker: Partial<Walker>) => api.patch(`/data/walkers/${id}`, walker).then((res: AxiosResponse) => res.data),
  delete: (id: string) => api.delete(`/data/walkers/${id}`).then((res: AxiosResponse) => res.data)
};

export const WalkAPI = {
  getAll: () => api.get('/data/walks').then((res: AxiosResponse) => res.data),
  getById: (id: string) => api.get(`/data/walks/${id}`).then((res: AxiosResponse) => res.data),
  create: (walk: Omit<Walk, 'id'>) => api.post('/data/walks', walk).then((res: AxiosResponse) => res.data),
  update: (id: string, walk: Partial<Walk>) => api.patch(`/data/walks/${id}`, walk).then((res: AxiosResponse) => res.data),
  delete: (id: string) => api.delete(`/data/walks/${id}`).then((res: AxiosResponse) => res.data),
  getByDogId: (dogId: string) => api.get(`/data/walks?dogId=${dogId}`).then((res: AxiosResponse) => res.data),
  getByWalkerId: (walkerId: string) => api.get(`/data/walks?walkerId=${walkerId}`).then((res: AxiosResponse) => res.data)
};

export const AssessmentAPI = {
  getAll: () => api.get('/data/assessments').then((res: AxiosResponse) => res.data),
  getById: (id: string) => api.get(`/data/assessments/${id}`).then((res: AxiosResponse) => res.data),
  create: (assessment: Omit<Assessment, 'id'>) => api.post('/data/assessments', assessment).then((res: AxiosResponse) => res.data),
  update: (id: string, assessment: Partial<Assessment>) => api.patch(`/data/assessments/${id}`, assessment).then((res: AxiosResponse) => res.data),
  delete: (id: string) => api.delete(`/data/assessments/${id}`).then((res: AxiosResponse) => res.data),
  getByDogId: (dogId: string) => api.get(`/data/assessments?dogId=${dogId}`).then((res: AxiosResponse) => res.data)
};