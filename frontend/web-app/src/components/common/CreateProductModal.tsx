'use client';
// frontend/web-app/src/components/common/CreateProductModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToast';
import { catalogApi, CreateProductInput } from '@/api/catalog';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { categoryApi, CategorySummary } from '@/api/category';
import { HttpError } from '@/api/client';
import styles from '../../app/partner/partner.module.css';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId?: string;
  partnerName?: string;
  onSuccess?: () => void;
}

const DEFAULT_CATEGORIES = [
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
  const [crossContaminationType, setCrossContaminationType] = useState<string>('NENHUM');
  const [milkDeclaration, setMilkDeclaration] = useState<'FREE' | 'CONTAINS' | 'TRACES' | null>(null);
  const [category, setCategory] = useState('Padaria & Confeitaria');
  const [price, setPrice] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPartners, setLoadingPartners] = useState(false);

  // Estados de categorias dinâmicas e criação inline
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const fetchCategories = useCallback(async (targetPartnerId?: string) => {
    setLoadingCategories(true);
    try {
      const data = await categoryApi.list(targetPartnerId);
      if (data && data.length > 0) {
        setCategories(data);
      } else {
        // Fallback para categorias padrão
        setCategories(
          DEFAULT_CATEGORIES.map((c, idx) => ({
            id: `default-${idx}`,
            name: c,
            normalizedName: c.toUpperCase(),
            status: 'APPROVED',
            visibility: 'GLOBAL',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }))
        );
      }
    } catch {
      // Fallback gracioso
      setCategories(
        DEFAULT_CATEGORIES.map((c, idx) => ({
          id: `default-${idx}`,
          name: c,
          normalizedName: c.toUpperCase(),
          status: 'APPROVED',
          visibility: 'GLOBAL',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      );
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (initialPartnerId) {
      setSelectedPartnerId(initialPartnerId);
      fetchCategories(initialPartnerId);
    } else if (token) {
      setLoadingPartners(true);
      partnerApi.listUserPartners(token)
        .then((data) => {
          setPartners(data || []);
          if (data && data.length > 0) {
            const firstId = data[0].id;
            setSelectedPartnerId(firstId);
            if (!brand) {
              setBrand(data[0].name);
            }
            fetchCategories(firstId);
          } else {
            fetchCategories();
          }
        })
        .catch(() => {
          fetchCategories();
        })
        .finally(() => setLoadingPartners(false));
    } else {
      fetchCategories();
    }
  }, [isOpen, token, initialPartnerId, fetchCategories, brand]);

  if (!isOpen) return null;

  const partnerTargetId = initialPartnerId || selectedPartnerId;

  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Você precisa estar autenticado para registrar uma categoria.', 'Erro');
      return;
    }

    if (!newCategoryName.trim()) {
      toast.warning('Digite o nome da nova categoria.', 'Nome Obrigatório');
      return;
    }

    if (!partnerTargetId) {
      toast.warning('Selecione um estabelecimento antes de registrar a categoria.', 'Estabelecimento Necessário');
      return;
    }

    setCreatingCategory(true);
    try {
      const created = await categoryApi.create(
        {
          name: newCategoryName.trim(),
          partnerId: partnerTargetId,
        },
        token
      );

      // Adiciona à lista local se não existir
      setCategories((prev) => {
        const exists = prev.some((c) => c.normalizedName === created.normalizedName);
        if (exists) return prev;
        return [created, ...prev];
      });

      setCategory(created.name);
      setNewCategoryName('');
      setIsAddingCustomCategory(false);

      toast.info(
        'Nova categoria registrada! Você já pode utilizá-la neste produto. Ela será moderada pela administração para exibição pública.',
        'Categoria Registrada'
      );
    } catch (err: any) {
      const msg = err instanceof HttpError ? err.message : err?.message || 'Erro ao registrar nova categoria.';
      toast.error(msg, 'Erro');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !token) {
      toast.error('Você precisa estar autenticado como parceiro para publicar produtos.', 'Erro');
      return;
    }

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

    if (!milkDeclaration) {
      toast.error('Informe obrigatoriamente a declaração de Leite (Livre, Contém Leite ou Traços de Leite).', 'Declaração Obrigatória');
      return;
    }

    setLoading(true);

    try {
      let finalIngredients = ingredients.trim();
      let finalCrossContamination = 'Nenhum (Ambiente 100% livre)';

      if (crossContaminationType === 'MAQUINARIO_COMPARTILHADO') {
        finalCrossContamination = 'Compartilha maquinário / linhas de produção';
      } else if (crossContaminationType === 'TRACOS') {
        finalCrossContamination = 'Pode conter traços (Alerta preventivo no rótulo)';
      }

      if (milkDeclaration === 'CONTAINS') {
        const lower = finalIngredients.toLowerCase();
        const hasMilkTerm = ['leite', 'lactose', 'queijo', 'manteiga', 'creme', 'whey', 'soro'].some((t) => lower.includes(t));
        if (!hasMilkTerm) {
          finalIngredients = `${finalIngredients} (Contém leite e derivados)`;
        }
      } else if (milkDeclaration === 'TRACES') {
        if (crossContaminationType === 'MAQUINARIO_COMPARTILHADO') {
          finalCrossContamination = 'Pode conter traços de leite (Compartilha maquinário / linhas de produção)';
        } else {
          finalCrossContamination = 'Pode conter traços de leite (Alerta preventivo no rótulo)';
        }
      } else if (milkDeclaration === 'FREE') {
        if (crossContaminationType === 'NENHUM') {
          finalCrossContamination = 'Nenhum (Ambiente 100% livre de contaminação cruzada)';
        }
      }

      const payload: CreateProductInput = {
        name: name.trim(),
        brand: brand.trim() || initialPartnerName || 'Própria',
        ingredients: finalIngredients,
        hasGluten,
        crossContamination: finalCrossContamination,
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
      setCrossContaminationType('NENHUM');
      setMilkDeclaration(null);
      setIsAddingCustomCategory(false);

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
        zIndex: 1100,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface, #182234)',
          borderRadius: '16px',
          padding: '1.75rem',
          maxWidth: '620px',
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
                    const newId = e.target.value;
                    setSelectedPartnerId(newId);
                    const p = partners.find((x) => x.id === newId);
                    if (p && !brand) setBrand(p.name);
                    fetchCategories(newId);
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Categoria *
                </label>
                {!isAddingCustomCategory && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomCategory(true)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-primary, #059669)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    + Nova Categoria
                  </button>
                )}
              </div>

              {!isAddingCustomCategory ? (
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === '__NEW_CATEGORY__') {
                      setIsAddingCustomCategory(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border, #334155)',
                    background: 'var(--color-bg, #0f172a)',
                    color: 'var(--color-text, #f8fafc)',
                  }}
                  disabled={loadingCategories}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name} {cat.status === 'PENDING_APPROVAL' ? '⏳ (Sob Moderação)' : ''}
                    </option>
                  ))}
                  <option value="__NEW_CATEGORY__">➕ + Registrar Nova Categoria...</option>
                </select>
              ) : (
                <div
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: '10px',
                    border: '1px solid var(--color-emerald, #10b981)',
                    background: 'rgba(16, 185, 129, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    boxSizing: 'border-box',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-emerald, #10b981)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      🏷️ Nova Categoria
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCustomCategory(false);
                        setNewCategoryName('');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-muted, #94a3b8)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        padding: '0 4px',
                        lineHeight: 1,
                      }}
                      title="Fechar"
                    >
                      ✕
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Ex: Doces Artesanais Low Carb"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.6rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border, #334155)',
                      background: 'var(--color-bg, #0f172a)',
                      color: 'var(--color-text, #f8fafc)',
                      boxSizing: 'border-box',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCategorySubmit(e);
                      }
                    }}
                    autoFocus
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCustomCategory(false);
                        setNewCategoryName('');
                      }}
                      className="btn btn-ghost"
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                      }}
                      disabled={creatingCategory}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCategorySubmit}
                      className="btn btn-em"
                      style={{
                        padding: '0.35rem 0.85rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: '6px',
                      }}
                      disabled={creatingCategory || !newCategoryName.trim()}
                    >
                      {creatingCategory ? 'Salvando…' : '✓ Salvar'}
                    </button>
                  </div>

                  <small style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>
                    Disponível de imediato para este produto (sob moderação pública).
                  </small>
                </div>
              )}
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

          {/* Segurança Alimentar: Glúten, Leite e Contaminação Cruzada */}
          <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--color-elevated, rgba(255,255,255,0.03))', border: '1px solid var(--color-border, #334155)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* 1. Glúten */}
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

            {/* 2. Declaração Obrigatória de Leite e Derivados */}
            <div style={{ borderTop: '1px solid var(--color-border, #334155)', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  🥛 Declaração de Leite e Derivados (Lactose / APLV) *
                </label>
                {!milkDeclaration && (
                  <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>* Obrigatório</span>
                )}
              </div>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Selecione obrigatoriamente se o produto possui leite ou derivados na formulação ou risco de traços:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.5rem' }}>
                {/* Opção 1: Sem Leite */}
                <button
                  type="button"
                  onClick={() => setMilkDeclaration('FREE')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '0.55rem 0.65rem',
                    borderRadius: '8px',
                    border: milkDeclaration === 'FREE' ? '2px solid #10b981' : '1px solid var(--color-border, #334155)',
                    background: milkDeclaration === 'FREE' ? 'rgba(16, 185, 129, 0.12)' : 'var(--color-bg, #0f172a)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: milkDeclaration === 'FREE' ? '#10b981' : 'var(--color-text)' }}>
                    🟢 Sem Leite nem Traços
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    100% Livre (Apto p/ APLV e intolerantes)
                  </span>
                </button>

                {/* Opção 2: Contém Leite */}
                <button
                  type="button"
                  onClick={() => setMilkDeclaration('CONTAINS')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '0.55rem 0.65rem',
                    borderRadius: '8px',
                    border: milkDeclaration === 'CONTAINS' ? '2px solid #ef4444' : '1px solid var(--color-border, #334155)',
                    background: milkDeclaration === 'CONTAINS' ? 'rgba(239, 68, 68, 0.12)' : 'var(--color-bg, #0f172a)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: milkDeclaration === 'CONTAINS' ? '#ef4444' : 'var(--color-text)' }}>
                    🥛 Contém Leite
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Possui leite/derivados na composição
                  </span>
                </button>

                {/* Opção 3: Traços de Leite */}
                <button
                  type="button"
                  onClick={() => setMilkDeclaration('TRACES')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '0.55rem 0.65rem',
                    borderRadius: '8px',
                    border: milkDeclaration === 'TRACES' ? '2px solid #f59e0b' : '1px solid var(--color-border, #334155)',
                    background: milkDeclaration === 'TRACES' ? 'rgba(245, 158, 11, 0.12)' : 'var(--color-bg, #0f172a)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: milkDeclaration === 'TRACES' ? '#f59e0b' : 'var(--color-text)' }}>
                    ⚠️ Traços de Leite
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Alerta de contaminação cruzada
                  </span>
                </button>
              </div>
            </div>

            {/* 3. Declaração de Risco de Contaminação Cruzada (100% em português) */}
            <div style={{ borderTop: '1px solid var(--color-border, #334155)', paddingTop: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Declaração de Risco de Contaminação Cruzada
              </label>
              <select
                value={crossContaminationType}
                onChange={(e) => setCrossContaminationType(e.target.value)}
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
                <option value="NENHUM">🛡️ NENHUM — Ambiente 100% livre (Sem risco de contaminação cruzada)</option>
                <option value="TRACOS">⚠️ TRAÇOS — Pode conter traços / Alerta preventivo no rótulo</option>
                <option value="MAQUINARIO_COMPARTILHADO">🏭 MAQUINÁRIO COMPARTILHADO — Compartilha maquinário/linhas de produção</option>
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
