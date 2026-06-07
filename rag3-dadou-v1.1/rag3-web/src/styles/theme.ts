import type { ThemeConfig } from 'antd';

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 6,
    fontSize: 14,
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f5f5f5',
  },
  components: {
    Menu: { itemBg: 'transparent', subMenuItemBg: 'transparent' },
    Card: { borderRadiusLG: 8 },
  },
};

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1668dc',
    colorBgContainer: '#141414',
    colorBgLayout: '#000000',
    colorText: 'rgba(255,255,255,0.85)',
  },
};