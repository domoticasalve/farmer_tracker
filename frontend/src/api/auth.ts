import { api } from './client'
import type { Token, User } from '../types'

export async function login(email: string, password: string): Promise<Token> {
  const form = new URLSearchParams({ username: email, password })
  return api.postForm<Token>('/auth/token', form)
}

export async function register(name: string, email: string, password: string): Promise<User> {
  return api.post<User>('/auth/register', { name, email, password })
}

export async function getMe(): Promise<User> {
  return api.get<User>('/auth/me')
}
