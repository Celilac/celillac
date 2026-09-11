'use client';
// frontend/web-app/src/components/common/ProductCertificationsManager.tsx
import React, { useState } from 'react';
import { ProductCertificationDTO, ProductImageDTO } from '@/api/catalog';

interface ProductCertificationsManagerProps {
  certifications: ProductCertificationDTO[];
  onChange: (certs: ProductCertificationDTO[]) => void;
  availableImages?: ProductImageDTO[];
  disabled?: boolean;
}

const PRESET_CERTIFICATIONS: Array<{
  type: string;
  name: string;
  defaultEntity: string;
  icon: string;
  badgeBg: string;
  badgeColor: string;
}> = [
  {
    type: 'ACELBRA_SEAL',
    name: 'Selo ACELBRA (Celíacos do Brasil)',
    defaultEntity: 'ACELBRA - Associação dos Celíacos do Brasil',
    icon: '🌾',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeColor: '#10b981',
  },
  {
    type: 'VEGAN_SVB',
    name: 'Certificado Vegano SVB',
    defaultEntity: 'Sociedade Vegetariana Brasileira',
    icon: '🌱',
    badgeBg: 'rgba(52, 211, 153, 0.15)',
    badgeColor: '#34d399',
  },
  {
    type: 'ORGANIC_BRAZIL',
    name: 'Selo Orgânico Brasil',
    defaultEntity: 'Ministério da Agricultura / SisOrg',
    icon: '🌿',
    badgeBg: 'rgba(132, 204, 22, 0.15)',
    badgeColor: '#a3e635',
  },
  {
    type: 'GLUTEN_FREE_LAB',
    name: 'Laudo Laboratorial (<20 ppm Glúten)',
    defaultEntity: 'Laboratório Credenciado',
    icon: '🔬',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeColor: '#38bdf8',
  },
  {
    type: 'OTHER',
    name: 'Outro Selo ou Laudo Oficial',
    defaultEntity: '',
    icon: '🏅',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeColor: '#c084fc',
  },
];

export const ProductCertificationsManager: React.FC<ProductCertificationsManagerProps> = ({
  certifications = [],
  onChange,
  availableImages = [],
  disabled = false,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('ACELBRA_SEAL');
  const [entity, setEntity] = useState<string>('ACELBRA - Associação dos Celíacos do Brasil');
  const [code, setCode] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [selectedImageId, setSelectedImageId] = useState<string>('');

  const handleSelectPreset = (type: string) => {
    setSelectedType(type);
    const preset = PRESET_CERTIFICATIONS.find((p) => p.type === type);
    if (preset) {
      setEntity(preset.defaultEntity);
    }
  };

  const handleAdd = () => {
    if (!entity.trim()) return;

    const newCert: ProductCertificationDTO = {
      certificationType: selectedType,
      certifyingEntity: entity.trim(),
      certificateCode: code.trim() || undefined,
      validUntil: validUntil || undefined,
      imageId: selectedImageId || undefined,
      verificationStatus: 'DECLARED_BY_PARTNER',
    };

    onChange([...certifications, newCert]);
    setCode('');
    setValidUntil('');
    setSelectedImageId('');
    setShowAddForm(false);
  };

  const handleRemove = (index: number) => {
    if (disabled) return;
    const next = [...certifications];
    next.splice(index, 1);
    onChange(next);
  };

  // Fotos de certificação disponíveis da galeria
  const certImages = availableImages.filter((img) => img.imageType === 'CERTIFICATION' || img.url);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Lista de Certificações Cadastradas */}
      {certifications.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {certifications.map((cert, idx) => {
            const preset = PRESET_CERTIFICATIONS.find((p) => p.type === cert.certificationType) || {
              icon: '🏅',
              name: cert.certificationType,
              badgeBg: 'rgba(99, 102, 241, 0.15)',
              badgeColor: '#818cf8',
            };

            const linkedImg = availableImages.find((img) => img.id === cert.imageId || img.url === cert.imageId);

            return (
              <div
                key={cert.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'var(--color-surface, #ffffff)',
                  border: '1px solid var(--color-border)',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{preset.icon}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>
                        {preset.name}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background:
                            cert.verificationStatus === 'VERIFIED_BY_CELILAC'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(148, 163, 184, 0.15)',
                          color:
                            cert.verificationStatus === 'VERIFIED_BY_CELILAC'
                              ? '#10b981'
                              : '#94a3b8',
                        }}
                      >
                        {cert.verificationStatus === 'VERIFIED_BY_CELILAC'
                          ? '✓ Auditado CeLiLac'
                          : 'Declarado pelo Parceiro'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        Entidade: <strong style={{ color: 'var(--color-text)' }}>{cert.certifyingEntity}</strong>
                      </span>
                      {cert.certificateCode && (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          Código / Lote: <code style={{ color: '#38bdf8' }}>{cert.certificateCode}</code>
                        </span>
                      )}
                      {cert.validUntil && (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          Validade: <strong style={{ color: 'var(--color-text)' }}>{cert.validUntil}</strong>
                        </span>
                      )}
                      {linkedImg && (
                        <span style={{ fontSize: '11px', color: '#10b981' }}>
                          📸 Foto Comprobatória Vinculada
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Remover
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
            background: 'var(--color-surface, #ffffff)',
            borderRadius: '10px',
            border: '1px dashed var(--color-border)',
            color: 'var(--color-text-muted)',
            fontSize: '12px',
          }}
        >
          Nenhum selo oficial ou laudo técnico adicionado ainda. Adicione certificações para exibir badges de autenticidade aos consumidores.
        </div>
      )}

      {/* Formulário de Adicionar Nova Certificação */}
      {!disabled && (
        <>
          {showAddForm ? (
            <div
              style={{
                background: 'var(--color-surface, #ffffff)',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
                Novo Selo ou Laudo Comprobatório
              </h4>

              {/* Seletor de Tipo */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Tipo de Selo / Certificação
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'var(--color-surface, #ffffff)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                  }}
                >
                  {PRESET_CERTIFICATIONS.map((p) => (
                    <option key={p.type} value={p.type}>
                      {p.icon} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Entidade Emissora */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Entidade Certificadora / Laboratório *
                </label>
                <input
                  type="text"
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                  placeholder="Ex: ACELBRA, Sociedade Vegetariana, Eurofins..."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'var(--color-surface, #ffffff)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Código / Registro e Validade */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Código / Registro / Laudo nº
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ex: LAU-2026/889"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'var(--color-surface, #ffffff)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Data de Validade (se houver)
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'var(--color-surface, #ffffff)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              {/* Vincular com foto da galeria */}
              {certImages.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Vincular Foto do Laudo da Galeria (Opcional)
                  </label>
                  <select
                    value={selectedImageId}
                    onChange={(e) => setSelectedImageId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'var(--color-surface, #ffffff)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      fontSize: '13px',
                    }}
                  >
                    <option value="">-- Não vincular foto --</option>
                    {certImages.map((img, i) => (
                      <option key={img.id || i} value={img.id || img.url}>
                        Foto {i + 1} {img.caption ? `(${img.caption})` : ''} - [{img.imageType}]
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Botões do Formulário */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: 'transparent',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!entity.trim()}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: !entity.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  Confirmar e Adicionar Selo
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#818cf8',
                border: '1px dashed rgba(99, 102, 241, 0.4)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span>+</span> Adicionar Selo Oficial ou Laudo Laboratorial
            </button>
          )}
        </>
      )}
    </div>
  );
};
