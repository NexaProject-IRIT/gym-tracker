import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const SettingsPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/profile', { replace: true });
  }, [navigate]);
  return null;
};
