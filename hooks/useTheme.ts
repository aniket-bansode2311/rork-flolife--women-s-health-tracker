import { useThemeStore } from '@/store/themeStore';
import Colors from '@/constants/colors';

export const useTheme = () => {
  const { isDarkMode, toggleDarkMode, setDarkMode } = useThemeStore();
  
  const colors = isDarkMode ? Colors.dark : Colors.light;
  
  return {
    colors,
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
  };
};