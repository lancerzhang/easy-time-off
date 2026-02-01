import React, { useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Simulate AD Authentication flow
      const user = await api.auth.login();
      onLogin(user);
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 mb-4">
          <img src="/app-icon.svg" alt="Easy Time-off" className="w-9 h-9" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900">Easy Time-off</h2>
        <p className="mt-2 text-sm text-gray-600">
          Unified leave management for Agile Teams
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-100">
          <div className="space-y-6">
            <div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Active Directory</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-70 disabled:cursor-wait"
            >
              {loading ? (
                <>Signing in...</>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Sign in with Corporate ID
                  <ArrowRight size={18} className="ml-1" />
                </>
              )}
            </button>
            
            <div className="mt-4 bg-blue-50 p-4 rounded-md">
                <p className="text-xs text-blue-700 text-center">
                    **Prototype Mode**: Clicking "Sign in" will automatically log you in as <b>Alice Chen</b>.
                </p>
            </div>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-8">
            &copy; 2025 Easy Time-off. Internal Tool.
        </p>
      </div>
    </div>
  );
};

export default Login;
