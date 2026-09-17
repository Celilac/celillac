// frontend/web-app/src/components/common/InternationalPhoneInput.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { formatLocalPhone, parsePhoneParts, buildE164Phone } from '../../utils/mask';

export interface CountryOption {
  code: string;
  name: string;
  ddi: string;
  flag: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'BR', name: 'Brasil', ddi: '+55', flag: '🇧🇷' },
  { code: 'PT', name: 'Portugal', ddi: '+351', flag: '🇵🇹' },
  { code: 'US', name: 'Estados Unidos / Canadá', ddi: '+1', flag: '🇺🇸' },
  { code: 'ES', name: 'Espanha', ddi: '+34', flag: '🇪🇸' },
  { code: 'AR', name: 'Argentina', ddi: '+54', flag: '🇦🇷' },
  { code: 'UY', name: 'Uruguai', ddi: '+598', flag: '🇺🇾' },
  { code: 'CL', name: 'Chile', ddi: '+56', flag: '🇨🇱' },
  { code: 'PY', name: 'Paraguai', ddi: '+595', flag: '🇵🇾' },
  { code: 'GB', name: 'Reino Unido', ddi: '+44', flag: '🇬🇧' },
  { code: 'FR', name: 'França', ddi: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemanha', ddi: '+49', flag: '🇩🇪' },
  { code: 'IT', name: 'Itália', ddi: '+39', flag: '🇮🇹' },
  { code: 'OTHER', name: 'Outro País', ddi: '+', flag: '🌐' },
];

interface Props {
  value: string; // formato salvo (ex: +5511999999999 ou legado)
  onChange: (fullPhoneE164: string) => void;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  label?: string;
}

export default function InternationalPhoneInput({
  value,
  onChange,
  required = false,
  disabled = false,
  id = 'intl-phone',
  label = 'Telefone / WhatsApp de Contato',
}: Props) {
  const [ddi, setDdi] = useState('+55');
  const [localNumber, setLocalNumber] = useState('');

  // Sincroniza estado inicial com a prop `value`
  useEffect(() => {
    if (value) {
      const parts = parsePhoneParts(value);
      setDdi(parts.ddi);
      setLocalNumber(parts.local);
    } else {
      setLocalNumber('');
    }
  }, [value]);

  function handleDdiChange(newDdi: string) {
    setDdi(newDdi);
    const reformattedLocal = formatLocalPhone(localNumber, newDdi);
    setLocalNumber(reformattedLocal);
    onChange(buildE164Phone(newDdi, reformattedLocal));
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const formatted = formatLocalPhone(raw, ddi);
    setLocalNumber(formatted);
    onChange(buildE164Phone(ddi, formatted));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {label} {required && <span style={{ color: 'var(--color-accent, #2563EB)' }}>*</span>}
        </label>
      )}

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Seletor de País / DDI */}
        <select
          value={COUNTRIES.some((c) => c.ddi === ddi) ? ddi : '+'}
          onChange={(e) => handleDdiChange(e.target.value)}
          disabled={disabled}
          aria-label="Código de Discagem Internacional (DDI)"
          style={{
            padding: '0.625rem 0.5rem',
            borderRadius: '8px',
            border: '1px solid var(--color-border, #CBD5E1)',
            backgroundColor: 'var(--color-card-bg, #FFFFFF)',
            color: 'var(--color-text, #0F172A)',
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: disabled ? 'not-allowed' : 'pointer',
            minWidth: '110px',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
        >
          {COUNTRIES.map((country) => (
            <option key={`${country.code}-${country.ddi}`} value={country.ddi}>
              {country.flag} {country.ddi}
            </option>
          ))}
        </select>

        {/* Input Numérico com máscara inteligente */}
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            id={id}
            type="tel"
            value={localNumber}
            onChange={handleNumberChange}
            placeholder={ddi === '+55' ? '(11) 99999-9999' : ddi === '+1' ? '(555) 000-0000' : 'Número local'}
            required={required}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem',
              borderRadius: '8px',
              border: '1px solid var(--color-border, #CBD5E1)',
              backgroundColor: 'var(--color-card-bg, #FFFFFF)',
              color: 'var(--color-text, #0F172A)',
              fontSize: '0.925rem',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          />
        </div>
      </div>

      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748B)' }}>
        {ddi === '+55'
          ? 'Formato nacional celular ou fixo com DDD.'
          : `Padrão internacional ${ddi}. O CeLiLac armazena automaticamente no formato E.164.`}
      </span>
    </div>
  );
}
