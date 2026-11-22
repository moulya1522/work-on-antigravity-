import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    cafeName: 'N CAFÉ',
    tagline: 'Artisan Brews & Gourmet Moments',
    currency: 'INR',
    currencySymbol: '₹',
    taxRate: 5,
    orderPrefix: 'NC-',
    phone: '+91 98765 43210',
    email: 'contact@ncafe.in',
    address: 'Plot 42, 100ft Road, Indiranagar, Bengaluru, Karnataka 560038'
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success && res.data.settings) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.warn('Could not load settings from server, using defaults:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return `${settings.currencySymbol || '₹'}${num.toLocaleString('en-IN', {
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings: fetchSettings,
        formatCurrency
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
