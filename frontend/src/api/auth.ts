import client from './client'
import type { User, Token } from '@/types'

export const authApi = {
  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    client.post<User>('/auth/register', data).then((r) => r.data),

  login: (email: string, password: string) => {
    const form = new FormData()
    form.append('username', email)
    form.append('password', password)
    return client
      .post<Token>('/auth/login', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data)
  },

  me: () => client.get<User>('/auth/me').then((r) => r.data),
}
