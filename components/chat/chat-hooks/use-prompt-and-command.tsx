import { useContext } from 'react';
import { PentestGPTContext } from '@/context/context';

export const usePromptAndCommand = () => {
  const { setUserInput } = useContext(PentestGPTContext);

  const handleInputChange = (value: string) => {
    setUserInput(value);
  };

  return {
    handleInputChange,
  };
};
