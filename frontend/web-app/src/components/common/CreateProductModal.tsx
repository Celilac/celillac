'use client';
// frontend/web-app/src/components/common/CreateProductModal.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToast';
import { catalogApi, CreateProductInput } from '@/api/catalog';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { HttpError } from '@/api/client';
import styles from '../../app/partner/partner.module.css';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId?: string;
  partnerName?: string;
  onSuccess?: () => void;
}

const CATEGORY_OPTIONS = [
  'Padaria & Confeitaria',
  'Pães & Torradas',
  'Massas & Farinhas',
  'Biscoitos & Snacks',
  'Lanches & Salgados',
  'Doces & Sobremesas',
  'Laticínios & Derivados',
  'Bebidas & Cafés',
  'Pratos Prontos / Congelados',
  'Outros',
];

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  partnerId: initialPartnerId,
  partnerName: initialPartnerName,
  onSuccess,
}) => {
  const { token, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const toast = useToast();

  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(initialPartnerId || '');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [hasGluten, setHasGluten] = useState<boolean>(false);
  const [crossContamination, setCrossContamination] = useState<string>('NONE');
  const [category, setCategory] = useState('Padaria & Confeitaria');
  const [price, setPrice] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPartners, setLoadingPartners] = useState(false);

  useEffect(() => {
    if (!isOpen || !token) return;

    if (initialPartnerId) {
      setSelectedPartnerId(initialPartnerId);
    } else {
      setLoadingPartners(true);
      partnerApi.listUserPartners(token)
        .then((data) => {
          setPartners(data || []);
          if (data && data.length > 0) {
            setSelectedPartnerId(data[0].id);
            if (!brand) {
              setBrand(data[0].name);
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoadingPartners(false));
    }
  }, [isOpen, token, initialPartnerId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !token) {
      toast.error('Você precisa estar autenticado como parceiro para publicar produtos.', 'Erro');
      return;
    }

    const partnerTargetId = initialPartnerId || selectedPartnerId;
    if (!partnerTargetId) {
      toast.error('Selecione ou cadastre um estabelecimento comercial antes de publicar produtos.', 'Estabelecimento Necessário');
      return;
    }

    if (!name.trim()) {
      toast.error('Informe o nome do produto.', 'Campo Obrigatório');
      return;
    }

    if (!ingredients.trim()) {
      toast.error('A lista de ingredientes é obrigatória para a transparência e segurança alimentar.', 'Ingredientes Obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const payload: CreateProductInput = {
        name: name.trim(),
        brand: brand.trim() || initialPartnerName || 'Própria',
        ingredients: ingredients.trim(),
        hasGluten,
        crossContamination,
        partnerId: partnerTargetId,
        category: category.trim(),
        price: price ? parseFloat(price) : undefined,
        imageUrl: imageUrl.trim() || undefined,
      };

      await catalogApi.create(payload, token);
      toast.success('Produto publicado com sucesso no catálogo!', 'Publicado');

      // Limpa formulário
      setName('');
      setIngredients('');
      setPrice('');
      setImageUrl('');
      setHasGluten(false);
      setCrossContamination('NONE');

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      const msg = err instanceof HttpError ? err.message : err?.message || 'Erro ao publicar produto no catálogo.';
      toast.error(msg, 'Erro na Publicação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface, #182234)',
          borderRadius: '16px',
          padding: '1.75rem',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--color-border, #334155)',
          color: 'var(--color-text, #f8fafc)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border, #334155)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📦 Publicar Produto no Catálogo
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted, #94a3b8)' }}>
              Cadastre itens fabricados ou fornecidos por seu estabelecimento.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--color-text-muted, #94a3b8)',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Seleção do Estabelecimento (se não fornecido previamente) */}
          {!initialPartnerId && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                🏢 Estabelecimento Produtor / Fornecedor *
              </label>
              {loadingPartners ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Carregando seus estabelecimentos…</p>
              ) : partners.length === 0 ? (
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--color-warning-bg, rgba(234, 179, 8, 0.1))', color: 'var(--color-warning, #eab308)', fontSize: '0.85rem', border: '1px solid var(--color-warning-border, rgba(234, 179, 8, 0.3))' }}>
                  ⚠️ Você ainda não possui um estabelecimento cadastrado. Crie seu estabelecimento para vincular os produtos.
                </div>
              ) : (
                <select
                  value={selectedPartnerId}
                  onChange={(e) => {
                    setSelectedPartnerId(e.target.value);
                    const p = partners.find((x) => x.id === e.target.value);
                    if (p && !brand) setBrand(p.name);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border, #334155)',
                    background: 'var(--color-bg, #0f172a)',
                    color: 'var(--color-text, #f8fafc)',
                  }}
                  required
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.type})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Nome do Produto & Marca */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Nome do Produto *
              </label>
              <input
                type="text"
                placeholder="Ex: Pão Artesanal de Mandioca"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #334155)',
                  background: 'var(--color-bg, #0f172a)',
                  color: 'var(--color-text, #f8fafc)',
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Marca / Linha
              </label>
              <input
                type="text"
                placeholder="Ex: Receita da Casa"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #334155)',
                  background: 'var(--color-bg, #0f172a)',
                  color: 'var(--color-text, #f8fafc)',
                }}
              />
            </div>
          </div>

          {/* Categoria & Preço */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #334155)',
                  background: 'var(--color-bg, #0f172a)',
                  color: 'var(--color-text, #f8fafc)',
                }}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Preço Sugerido / Unitário (R$, opcional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #334155)',
                  background: 'var(--color-bg, #0f172a)',
                  color: 'var(--color-text, #f8fafc)',
                }}
              />
            </div>
          </div>

          {/* Ingredientes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Lista Completa de Ingredientes *
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Polvilho doce, farinha de arroz, ovos, óleo vegetal, água, sal e fermento biológico."
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border, #334155)',
                background: 'var(--color-bg, #0f172a)',
                color: 'var(--color-text, #f8fafc)',
                resize: 'vertical',
                fontSize: '0.85rem',
              }}
              required
            />
            <small style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '2px' }}>
              🛡️ Os ingredientes são processados pelo motor de segurança alimentar para alertar alérgenos aos celíacos.
            </small>
          </div>

          {/* Glúten & Contaminação Cruzada */}
          <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--color-elevated, rgba(255,255,255,0.03))', border: '1px solid var(--color-border, #334155)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>Contém Glúten?</strong>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {hasGluten ? 'Sim (Produto CONTÉM trigo, aveia, cevada ou centeio)' : 'Não (Produto Livre de Glúten)'}
                </p>
              </div>
              <label className={styles.switch} style={{ margin: 0 }}>
                <input
                  type="checkbox"
                  checked={hasGluten}
                  onChange={(e) => setHasGluten(e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Declaração de Risco de Contaminação Cruzada
              </label>
              <select
                value={crossContamination}
                onChange={(e) => setCrossContamination(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border, #334155)',
                  background: 'var(--color-bg, #0f172a)',
                  color: 'var(--color-text, #f8fafc)',
                  fontSize: '0.85rem',
                }}
              >
                <option value="NONE">🛡️ NONE — Ambiente 100% livre (Sem risco de contaminação cruzada)</option>
                <option value="TRACES">⚠️ TRACES — Pode conter traços / Alerta preventivo no rótulo</option>
                <option value="SHARED_EQUIPMENT">🏭 SHARED_EQUIPMENT — Compartilha maquinário/linhas de produção</option>
              </select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={loading}
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-em"
              disabled={loading || (!initialPartnerId && partners.length === 0)}
              style={{ padding: '0.6rem 1.4rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {loading ? 'Publicando…' : '🚀 Publicar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
