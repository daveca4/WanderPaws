import axios from 'axios';
import type { Dog, Owner, Walker, Walk, Assessment } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'max-age=300' // 5 min cache
  }
});

// Add request/response interceptors for consistent error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API error:', error);
    return Promise.reject(error);
  }
);

export const DogAPI = {
  getAll: () => api.get('/data/dogs').then(res => res.data),
  getAllData: () => api.get('/data/all').then(res => res.data),
  getById: (id: string) => api.get(`/data/dogs/${id}`).then(res => res.data),
  create: (dog: Omit<Dog, 'id'>) => api.post('/data/dogs', dog).then(res => res.data),
  update: (id: string, dog: Partial<Dog>) => api.patch(`/data/dogs/${id}`, dog).then(res => res.data),
  delete: (id: string) => api.delete(`/data/dogs/${id}`).then(res => res.data),
  getByOwnerId: (ownerId: string) => api.get(`/data/owners/${ownerId}/dogs`).then(res => res.data)
};

export const OwnerAPI = {
  getAll: () => api.get('/data/owners').then(res => res.data),
  getById: (id: string) => api.get(`/data/owners/${id}`).then(res => res.data),
  create: (owner: Omit<Owner, 'id'>) => api.post('/data/owners', owner).then(res => res.data),
  update: (id: string, owner: Partial<Owner>) => api.patch(`/data/owners/${id}`, owner).then(res => res.data),
  delete: (id: string) => api.delete(`/data/owners/${id}`).then(res => res.data),
  ensure: (userId: string, data: any) => api.post('/data/owners/ensure', { userId, ...data }).then(res => res.data)
};

export const WalkerAPI = {
  getAll: () => api.get('/data/walkers').then(res => res.data),
  getById: (id: string) => api.get(`/data/walkers/${id}`).then(res => res.data),
  create: (walker: Omit<Walker, 'id'>) => api.post('/data/walkers', walker).then(res => res.data),
  update: (id: string, walker: Partial<Walker>) => api.patch(`/data/walkers/${id}`, walker).then(res => res.data),
  delete: (id: string) => api.delete(`/data/walkers/${id}`).then(res => res.data)
};

export const WalkAPI = {
  getAll: () => api.get('/data/walks').then(res => res.data),
  getById: (id: string) => api.get(`/data/walks/${id}`).then(res => res.data),
  create: (walk: Omit<Walk, 'id'>) => api.post('/data/walks', walk).then(res => res.data),
  update: (id: string, walk: Partial<Walk>) => api.patch(`/data/walks/${id}`, walk).then(res => res.data),
  delete: (id: string) => api.delete(`/data/walks/${id}`).then(res => res.data),
  getByDogId: (dogId: string) => api.get(`/data/walks?dogId=${dogId}`).then(res => res.data),
  getByWalkerId: (walkerId: string) => api.get(`/data/walks?walkerId=${walkerId}`).then(res => res.data)
};

export const AssessmentAPI = {
  getAll: () => api.get('/data/assessments').then(res => res.data),
  getById: (id: string) => api.get(`/data/assessments/${id}`).then(res => res.data),
  create: (assessment: Omit<Assessment, 'id'>) => api.post('/data/assessments', assessment).then(res => res.data),
  update: (id: string, assessment: Partial<Assessment>) => api.patch(`/data/assessments/${id}`, assessment).then(res => res.data),
  delete: (id: string) => api.delete(`/data/assessments/${id}`).then(res => res.data),
  getByDogId: (dogId: string) => api.get(`/data/assessments?dogId=${dogId}`).then(res => res.data)
}; 