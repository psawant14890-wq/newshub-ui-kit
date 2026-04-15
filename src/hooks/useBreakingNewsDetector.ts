import { useState } from 'react';
import { generateWithGemini } from '../lib/gemini';

export function useBreakingNewsDetector() {
  const [checking, setChecking] = useState(false);
  const [isBreaking, setIsBreaking] = useState<boolean | null>(null);

  const checkBreaking = async (title: string, excerpt: string): Promise<boolean> => {
    setChecking(true);
    try {
      const result = await generateWithGemini(
        `Is this news article about a breaking/urgent news event? Breaking news includes: disasters, deaths of major figures, major political events, major accidents, terrorist attacks. Reply with ONLY: breaking OR normal\n\nTitle: ${title}\nExcerpt: ${excerpt}`
      );
      const breaking = result.trim().toLowerCase().includes('breaking');
      setIsBreaking(breaking);
      return breaking;
    } catch {
      setIsBreaking(false);
      return false;
    } finally {
      setChecking(false);
    }
  };

  return { checkBreaking, checking, isBreaking };
}
