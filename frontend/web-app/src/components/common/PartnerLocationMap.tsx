// frontend/web-app/src/components/common/PartnerLocationMap.tsx
'use client';

import React from 'react';

interface Props {
  address?: string;
  city?: string;
  state?: string;
  name?: string;
  height?: string | number;
  showDirectionsButton?: boolean;
}

export default function PartnerLocationMap({
  address,
  city,
  state,
  name,
  height = 280,
  showDirectionsButton = true,
}: Props) {
  const parts = [name, address, city, state].filter((p) => p && p.trim().length > 0);
  const fullQuery = parts.join(', ');

  const hasLocation = Boolean(address && address.trim().length > 3);

  // Link direto para abrir no aplicativo ou web do Google Maps
  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullQuery || 'Brasil')}`;

  // Iframe oficial do Google Maps Embed sem necessidade de chave de API
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(fullQuery)}&output=embed`;

  if (!hasLocation) {
    return (
      <div
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          borderRadius: '12px',
          border: '1px dashed var(--color-border, #CBD5E1)',
          backgroundColor: 'var(--color-input-bg, #F8FAFC)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '1.5rem',
          textAlign: 'center',
          color: 'var(--color-text-muted, #64748B)',
        }}
      >
        <span style={{ fontSize: '2rem' }}>📍</span>
        <p style={{ margin: 0, fontWeight: 500, fontSize: '0.925rem', color: 'var(--color-text, #334155)' }}>
          Pré-visualização da Localização no Mapa
        </p>
        <p style={{ margin: 0, fontSize: '0.825rem', maxWidth: '340px' }}>
          Informe o endereço, cidade e estado acima para carregar o mapa interativo do Google Maps.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--color-border, #E2E8F0)',
        backgroundColor: 'var(--color-card-bg, #FFFFFF)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div
        style={{
          width: '100%',
          height: typeof height === 'number' ? `${height}px` : height,
          position: 'relative',
          backgroundColor: '#E5E7EB',
        }}
      >
        <iframe
          title={`Mapa de localização: ${name || address}`}
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen={false}
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {showDirectionsButton && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-card-bg, #FFFFFF)',
            borderTop: '1px solid var(--color-border, #E2E8F0)',
            fontSize: '0.85rem',
          }}
        >
          <span style={{ color: 'var(--color-text-muted, #64748B)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🗺️</span> <strong>Localização Georreferenciada</strong>
          </span>

          <a
            href={googleMapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              backgroundColor: 'var(--color-accent, #2563EB)',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.825rem',
              textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}
          >
            <span>🧭</span> Abrir no Google Maps / Como Chegar ↗
          </a>
        </div>
      )}
    </div>
  );
}
