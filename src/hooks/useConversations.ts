import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchConversations } from '../api/messages'
import { useChatStore } from '../store/chatStore'

export function useConversations() {
  const setConversations = useChatStore((s) => s.setConversations)

  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    refetchInterval: 30_000,
    staleTime: 10_000,
  })

  useEffect(() => {
    if (query.data) {
      setConversations(query.data)
    }
  }, [query.data, setConversations])

  return query
}
