'use client';
// frontend/web-app/src/components/common/ProductImageGalleryUploader.tsx
import React, { useState, useRef, useCallback } from 'react';
import { ProductImageDTO, ProductImageType } from '@/api/catalog';
import { compressImage, validateImageFile } from '@/utils/image';

interface ProductImageGalleryUploaderProps {
  images: ProductImageDTO[];
  onChange: (images: ProductImageDTO[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

const IMAGE_TYPE_LABELS: Record<ProductImageType, { label: string; icon: string; bg: string; color: string; border: string }> = {
  PRODUCT: {
    label: 'Foto do Produto',
    icon: '📸',
    bg: 'rgba(99, 102, 241, 0.15)',
    color: '#818cf8',
    border: 'rgba(99, 102, 241, 0.35)',
  },
  PACKAGING: {
    label: 'Embalagem Fechada',
    icon: '📦',
    bg: 'rgba(148, 163, 184, 0.15)',
    color: '#cbd5e1',
    border: 'rgba(148, 163, 184, 0.35)',
  },
  LABEL: {
    label: 'Rótulo Frontal',
    icon: '🏷️',
    bg: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    border: 'rgba(16, 185, 129, 0.35)',
  },
  INGREDIENTS: {
    label: 'Ingredientes & Alérgenos',
    icon: '🥣',
    bg: 'rgba(245, 158, 11, 0.15)',
    color: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.35)',
  },
  NUTRITIONAL_INFO: {
    label: 'Tabela Nutricional',
    icon: '📊',
    bg: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    border: 'rgba(56, 189, 248, 0.35)',
  },
  CERTIFICATION: {
    label: 'Laudo / Certificação',
    icon: '🏅',
    bg: 'rgba(52, 211, 153, 0.15)',
    color: '#6ee7b7',
    border: 'rgba(52, 211, 153, 0.35)',
  },
};

export const ProductImageGalleryUploader: React.FC<ProductImageGalleryUploaderProps> = ({
  images,
  onChange,
  maxImages = 8,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [urlType, setUrlType] = useState<ProductImageType>('PRODUCT');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasLabelOrIngredients = images.some(
    (img) => img.imageType === 'LABEL' || img.imageType === 'INGREDIENTS'
  );

  // Processa lista de arquivos File (arrastados ou selecionados)
  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (disabled) return;
      setGeneralError(null);

      const files = Array.from(fileList);
      if (files.length === 0) return;

      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) {
        setGeneralError(`Limite máximo de ${maxImages} imagens atingido para este produto.`);
        return;
      }

      const filesToProcess = files.slice(0, remainingSlots);
      if (files.length > remainingSlots) {
        setGeneralError(`Apenas ${remainingSlots} imagem(ns) foram processadas para respeitar o limite de ${maxImages}.`);
      }

      setIsProcessing(true);
      const newUploadedImages: ProductImageDTO[] = [];

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        setProcessingStatus(`Otimizando foto ${i + 1} de ${filesToProcess.length}...`);

        const validation = validateImageFile(file);
        if (!validation.valid) {
          setGeneralError(validation.error || 'Arquivo de imagem inválido.');
          continue;
        }

        try {
          // Otimiza no cliente para ~150-250KB WebP/JPEG com nitidez para texto de rótulos
          const compressedDataUrl = await compressImage(file, 1280, 1280, 0.85);

          // Sugestão automática inteligente de tipo: se for a primeira, PRODUCT; se for segunda e não tem LABEL, LABEL
          const currentTotal = images.length + newUploadedImages.length;
          let suggestedType: ProductImageType = 'PRODUCT';
          if (currentTotal === 1) {
            suggestedType = 'LABEL';
          } else if (currentTotal === 2) {
            suggestedType = 'INGREDIENTS';
          } else if (currentTotal === 3) {
            suggestedType = 'NUTRITIONAL_INFO';
          }

          newUploadedImages.push({
            url: compressedDataUrl,
            imageType: suggestedType,
            caption: '',
            displayOrder: currentTotal,
            isCover: currentTotal === 0, // Primeira foto vira capa por padrão
          });
        } catch (err: any) {
          setGeneralError(err?.message || 'Falha ao processar arquivo de imagem.');
        }
      }

      if (newUploadedImages.length > 0) {
        const updated = [...images, ...newUploadedImages];
        // Assegurar que ao menos 1 imagem seja capa
        const hasCover = updated.some((img) => img.isCover);
        if (!hasCover && updated.length > 0) {
          updated[0].isCover = true;
        }
        onChange(updated);
      }

      setIsProcessing(false);
      setProcessingStatus('');
    },
    [disabled, images, maxImages, onChange]
  );

  // Manipuladores de Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && images.length < maxImages) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reseta o input para permitir selecionar o mesmo arquivo novamente se necessário
      e.target.value = '';
    }
  };

  // Adição manual por URL
  const handleAddUrl = () => {
    setUrlError(null);
    if (!urlInputValue.trim()) {
      setUrlError('Digite uma URL válida.');
      return;
    }
    const cleanUrl = urlInputValue.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('data:image/')) {
      setUrlError('A URL deve começar com https:// ou http://');
      return;
    }

    if (images.length >= maxImages) {
      setUrlError(`Limite de ${maxImages} fotos atingido.`);
      return;
    }

    const isFirst = images.length === 0;
    const newImage: ProductImageDTO = {
      url: cleanUrl,
      imageType: urlType,
      caption: '',
      displayOrder: images.length,
      isCover: isFirst,
    };

    onChange([...images, newImage]);
    setUrlInputValue('');
    setShowUrlInput(false);
  };

  // Definir como capa
  const handleSetCover = (indexToCover: number) => {
    const updated = images.map((img, idx) => ({
      ...img,
      isCover: idx === indexToCover,
    }));
    onChange(updated);
  };

  // Alterar classificação de tipo
  const handleChangeType = (index: number, newType: ProductImageType) => {
    const updated = [...images];
    updated[index] = { ...updated[index], imageType: newType };
    onChange(updated);
  };

  // Alterar legenda
  const handleChangeCaption = (index: number, newCaption: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], caption: newCaption };
    onChange(updated);
  };

  // Remover foto
  const handleRemoveImage = (indexToRemove: number) => {
    const remaining = images.filter((_, idx) => idx !== indexToRemove);
    // Se a imagem removida era capa e ainda sobraram imagens, definir a primeira como capa
    const wasCover = images[indexToRemove]?.isCover;
    if (wasCover && remaining.length > 0) {
      remaining[0].isCover = true;
    }
    // Reajustar ordens
    const reordered = remaining.map((img, idx) => ({
      ...img,
      displayOrder: idx,
    }));
    onChange(reordered);
  };

  // Reordenação (Mover para esquerda / direita)
  const handleMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const updated = [...images];
    const item = updated.splice(fromIndex, 1)[0];
    updated.splice(toIndex, 0, item);
    const reordered = updated.map((img, idx) => ({
      ...img,
      displayOrder: idx,
    }));
    onChange(reordered);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Cabeçalho da Seção de Imagens */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
            <span>📸</span>
            <span>Galeria de Imagens & Rótulos</span>
          </label>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
            Adicione fotos da embalagem, rótulo frontal e ingredientes para comprovação e transparência.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              background: images.length >= maxImages ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: images.length >= maxImages ? '#ef4444' : '#10b981',
              border: `1px solid ${images.length >= maxImages ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            }}
          >
            {images.length} de {maxImages} fotos
          </span>

          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#38bdf8',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '2px 4px',
              textDecoration: 'underline',
            }}
          >
            {showUrlInput ? '✕ Ocultar link URL' : '🔗 Adicionar via URL'}
          </button>
        </div>
      </div>

      {/* Input Opcional de Adição por URL */}
      {showUrlInput && (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            padding: '0.75rem',
            borderRadius: '8px',
            background: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border)',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="url"
            placeholder="Cole o link da imagem (ex: https://...)"
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '0.5rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface, #ffffff)',
              color: 'var(--color-text)',
              fontSize: '0.8rem',
            }}
          />

          <select
            value={urlType}
            onChange={(e) => setUrlType(e.target.value as ProductImageType)}
            style={{
              padding: '0.5rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface, #ffffff)',
              color: 'var(--color-text)',
              fontSize: '0.8rem',
            }}
          >
            {Object.entries(IMAGE_TYPE_LABELS).map(([type, meta]) => (
              <option key={type} value={type}>
                {meta.icon} {meta.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleAddUrl}
            disabled={images.length >= maxImages || !urlInputValue.trim()}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: '6px',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: images.length >= maxImages || !urlInputValue.trim() ? 'not-allowed' : 'pointer',
              opacity: images.length >= maxImages || !urlInputValue.trim() ? 0.6 : 1,
            }}
          >
            Adicionar Foto
          </button>

          {urlError && (
            <div style={{ width: '100%', fontSize: '0.72rem', color: '#ef4444', marginTop: '2px' }}>
              {urlError}
            </div>
          )}
        </div>
      )}

      {/* Zona de Drag & Drop para Upload de Arquivos */}
      {images.length < maxImages && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: isDragging ? '2px dashed #10b981' : '2px dashed var(--color-border)',
            background: isDragging
              ? 'rgba(16, 185, 129, 0.08)'
              : 'var(--color-elevated, #f1f0ec)',
            borderRadius: '12px',
            padding: '1.25rem 1rem',
            textAlign: 'center',
            cursor: disabled || isProcessing ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png, image/jpeg, image/jpg, image/webp"
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
            disabled={disabled || isProcessing}
          />

          {isProcessing ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  border: '3px solid rgba(16, 185, 129, 0.2)',
                  borderTopColor: '#10b981',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                {processingStatus || 'Processando imagens...'}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                Comprimindo e otimizando resolução para leitura de rótulos
              </span>
            </div>
          ) : (
            <>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  color: '#10b981',
                }}
              >
                📥
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>
                Arraste fotos aqui ou <span style={{ color: '#10b981', textDecoration: 'underline' }}>clique para escolher</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                Fotos da câmera ou arquivos PNG, JPG e WebP (até 15 MB por foto)
              </div>
            </>
          )}
        </div>
      )}

      {/* Alerta / Mensagem de Erro Geral */}
      {generalError && (
        <div
          style={{
            padding: '0.6rem 0.8rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⚠️ {generalError}</span>
          <button
            type="button"
            onClick={() => setGeneralError(null)}
            style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid de Cards de Imagens Cadastradas */}
      {images.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '0.9rem',
          }}
        >
          {images.map((img, index) => {
            const typeMeta = IMAGE_TYPE_LABELS[img.imageType || 'PRODUCT'] || IMAGE_TYPE_LABELS.PRODUCT;
            const isCover = Boolean(img.isCover);

            return (
              <div
                key={img.id || `img-${index}`}
                style={{
                  background: 'var(--color-surface, #ffffff)',
                  border: isCover ? '2px solid #f59e0b' : '1px solid var(--color-border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: isCover ? '0 4px 14px rgba(245, 158, 11, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.25)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Visualizador / Thumbnail */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '140px',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.caption || `Foto ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%231e293b" width="100" height="100"/><text fill="%2394a3b8" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12">Erro ao exibir</text></svg>';
                    }}
                  />

                  {/* Ribbon / Badge de Capa */}
                  {isCover && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#fff',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        letterSpacing: '0.02em',
                      }}
                    >
                      ⭐ CAPA PRINCIPAL
                    </div>
                  )}

                  {/* Badge de Ordem */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0, 0, 0, 0.65)',
                      backdropFilter: 'blur(4px)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    #{index + 1}
                  </div>
                </div>

                {/* Controles do Card */}
                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  {/* Seletor de Classificação / Tipo */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '2px' }}>
                      Classificação da Imagem
                    </label>
                    <select
                      value={img.imageType || 'PRODUCT'}
                      onChange={(e) => handleChangeType(index, e.target.value as ProductImageType)}
                      style={{
                        width: '100%',
                        padding: '0.4rem 0.5rem',
                        borderRadius: '6px',
                        border: `1px solid ${typeMeta.border}`,
                        background: typeMeta.bg,
                        color: typeMeta.color,
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {Object.entries(IMAGE_TYPE_LABELS).map(([type, meta]) => (
                        <option
                          key={type}
                          value={type}
                          style={{ background: 'var(--color-surface, #ffffff)', color: 'var(--color-text)' }}
                        >
                          {meta.icon} {meta.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Legenda Opcional */}
                  <div>
                    <input
                      type="text"
                      placeholder="Legenda (ex: detalhe do lacre)..."
                      value={img.caption || ''}
                      onChange={(e) => handleChangeCaption(index, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.35rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface, #ffffff)',
                        color: 'var(--color-text)',
                        fontSize: '0.72rem',
                      }}
                    />
                  </div>

                  {/* Ações: Definir Capa, Reordenar e Excluir */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* Botão Capa */}
                    {!isCover ? (
                      <button
                        type="button"
                        onClick={() => handleSetCover(index)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#fbbf24',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 4px',
                        }}
                        title="Tornar imagem de capa principal do catálogo"
                      >
                        ☆ Tornar Capa
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700 }}>
                        ✓ Capa Atual
                      </span>
                    )}

                    {/* Botões de Reordenação e Exclusão */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <button
                        type="button"
                        onClick={() => handleMove(index, index - 1)}
                        disabled={index === 0}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          color: index === 0 ? '#475569' : '#cbd5e1',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          padding: '2px 6px',
                          fontSize: '0.7rem',
                        }}
                        title="Mover foto para esquerda"
                      >
                        ◀
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMove(index, index + 1)}
                        disabled={index === images.length - 1}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          color: index === images.length - 1 ? '#475569' : '#cbd5e1',
                          cursor: index === images.length - 1 ? 'not-allowed' : 'pointer',
                          padding: '2px 6px',
                          fontSize: '0.7rem',
                        }}
                        title="Mover foto para direita"
                      >
                        ▶
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '4px',
                          color: '#f87171',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          fontSize: '0.7rem',
                        }}
                        title="Remover imagem"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dica de Segurança Alimentar Baseada nas Imagens Cadastradas */}
      <div
        style={{
          padding: '0.75rem 0.9rem',
          borderRadius: '10px',
          background: hasLabelOrIngredients ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)',
          border: `1px solid ${hasLabelOrIngredients ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>
          {hasLabelOrIngredients ? '🛡️' : '💡'}
        </span>
        <div style={{ fontSize: '0.74rem', lineHeight: 1.45, color: hasLabelOrIngredients ? '#34d399' : '#93c5fd' }}>
          {hasLabelOrIngredients ? (
            <>
              <strong>Comprovação de Rótulo / Ingredientes presente:</strong> Fotos nítidas do rótulo físico e dos ingredientes aumentam a pontuação de conformidade e aceleram a aprovação nas buscas de consumidores com restrições alimentares.
            </>
          ) : (
            <>
              <strong>Dica CeLiLac para Auditoria:</strong> Recomendamos fotografar a embalagem com a <em>Lista de Ingredientes</em> e a declaração <em>"Pode Conter..."</em> para comprovar visualmente as alegações aos consumidores celíacos e APLV.
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
