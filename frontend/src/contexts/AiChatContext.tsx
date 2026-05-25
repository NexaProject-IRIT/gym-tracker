/**
 * Провайдер стейта ИИ-чата.
 *
 * Проблема которую решаем: useAiChat внутри AiChatPage создаёт стейт
 * в самом компоненте — при переходе на другую вкладку компонент анмаунтится
 * и стейт (включая optimistic-сообщение и флаг sending) теряется. При
 * возврате loadHistory перезагружает историю из БД, но pending-ответ,
 * который ещё летит от GigaChat, уже некуда записать.
 *
 * Решение: поднимаем useAiChat в этот контекст, который живёт в MainLayout
 * (выше всех вкладок). Компоненты достают стейт через useAiChatContext().
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useAiChat } from '../hooks/useAiChat';

type AiChatContextType = ReturnType<typeof useAiChat>;

const AiChatContext = createContext<AiChatContextType | null>(null);

export const AiChatProvider = ({ children }: { children: ReactNode }) => {
  const chat = useAiChat();
  return <AiChatContext.Provider value={chat}>{children}</AiChatContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAiChatContext = (): AiChatContextType => {
  const ctx = useContext(AiChatContext);
  if (!ctx) throw new Error('useAiChatContext вызван вне AiChatProvider');
  return ctx;
};