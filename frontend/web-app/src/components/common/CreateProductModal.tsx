'use client';
// frontend/web-app/src/components/common/CreateProductModal.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/useToast';
import {
  catalogApi,
  CreateProductInput,
  CommercialOrigin,
  PublicationStatus,
  ProductImageDTO,
  AllergenPresence,
  CrossContaminationDetails,
  DietaryFeature,
  InformationOrigin,
  NutritionalInfo,
  ProductCertificationDTO,
} from '@/api/catalog';
import { partnerApi, PartnerSummary } from '@/api/partner';
import { categoryApi, CategorySummary } from '@/api/category';
import { HttpError } from '@/api/client';
import { ProductImageGalleryUploader } from './ProductImageGalleryUploader';
import { AllergenSafetyMatrix } from './AllergenSafetyMatrix';
import { CrossContaminationSelector } from './CrossContaminationSelector';
import { DietaryFeaturesPicker } from './DietaryFeaturesPicker';
import { ProductCertificationsManager } from './ProductCertificationsManager';
import { NutritionalInfoAccordion } from './NutritionalInfoAccordion';

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

const UNITS_OF_MEASURE = [
  { value: 'g', label: 'g (gramas)' },
  { value: 'kg', label: 'kg (quilos)' },
  { value: 'ml', label: 'ml (mililitros)' },
  { value: 'L', label: 'L (litros)' },
  { value: 'un', label: 'un (unidades)' },
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

  // Estabelecimentos
  const [partners, setPartners] = useState<PartnerSummary[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(initialPartnerId || '');
  const [loadingPartners, setLoadingPartners] = useState(false);

  // Campos de Identificação
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Padaria & Confeitaria');
  const [price, setPrice] = useState<string>('');
  const [shortDescription, setShortDescription] = useState('');
  const [netContent, setNetContent] = useState<string>('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('g');
  const [sku, setSku] = useState('');
  const [ean, setEan] = useState('');
  const [commercialOrigin, setCommercialOrigin] = useState<CommercialOrigin>('OWN_MANUFACTURE');

  // Campos de Composição & Rótulo
  const [ingredients, setIngredients] = useState('');
  const [mayContainTraces, setMayContainTraces] = useState('');
  const [compositionNotes, setCompositionNotes] = useState('');

  // Campos de Segurança Alimentar (Fase 1)
  const [hasGluten, setHasGluten] = useState<boolean>(false);
  const [milkDeclaration, setMilkDeclaration] = useState<'FREE' | 'CONTAINS' | 'TRACES' | null>(null);
  const [crossContaminationType, setCrossContaminationType] = useState<string>('NENHUM');

  // Galeria de Imagens & Rótulos (Fase 2)
  const [images, setImages] = useState<ProductImageDTO[]>([]);
  const coverImage = useMemo(
    () => images.find((img) => img.isCover) || images[0] || null,
    [images]
  );

  // Matriz de Alérgenos, Riscos de Ambiente, Estilos de Vida e Certificações (Fase 3)
  const [declaredAllergens, setDeclaredAllergens] = useState<Record<string, AllergenPresence>>({});
  const [crossContaminationDetails, setCrossContaminationDetails] = useState<CrossContaminationDetails>({
    environmentRisk: 'UNKNOWN_RISK',
  });
  const [dietaryFeatures, setDietaryFeatures] = useState<DietaryFeature[]>([]);
  const [informationOrigin, setInformationOrigin] = useState<InformationOrigin>('PARTNER_DECLARED');
  const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalInfo>({});
  const [certifications, setCertifications] = useState<ProductCertificationDTO[]>([]);

  // Status e Submissão
  const [loading, setLoading] = useState(false);
  const [activeStepMobile, setActiveStepMobile] = useState<number>(1);
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);

  // Categorias Dinâmicas
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const partnerTargetId = initialPartnerId || selectedPartnerId;
  const draftStorageKey = useMemo(() => `celilac_draft_product_${partnerTargetId || 'temp'}`, [partnerTargetId]);

  // Carrega categorias
  const fetchCategories = useCallback(async (targetPartnerId?: string) => {
    setLoadingCategories(true);
    try {
      const data = await categoryApi.list(targetPartnerId);
      if (data && data.length > 0) {
        setCategories(data);
      } else {
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

  // Inicialização ao abrir modal
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
            if (!brand) setBrand(data[0].name);
            fetchCategories(firstId);
          } else {
            fetchCategories();
          }
        })
        .catch(() => fetchCategories())
        .finally(() => setLoadingPartners(false));
    } else {
      fetchCategories();
    }

    // Tentar restaurar rascunho local se existir
    try {
      const savedDraft = localStorage.getItem(draftStorageKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.name && !name) {
          setName(parsed.name || '');
          setBrand(parsed.brand || '');
          setCategory(parsed.category || 'Padaria & Confeitaria');
          setPrice(parsed.price || '');
          setShortDescription(parsed.shortDescription || '');
          setNetContent(parsed.netContent || '');
          setUnitOfMeasure(parsed.unitOfMeasure || 'g');
          setSku(parsed.sku || '');
          setEan(parsed.ean || '');
          setCommercialOrigin(parsed.commercialOrigin || 'OWN_MANUFACTURE');
          setIngredients(parsed.ingredients || '');
          setMayContainTraces(parsed.mayContainTraces || '');
          setCompositionNotes(parsed.compositionNotes || '');
          setHasGluten(Boolean(parsed.hasGluten));
          setMilkDeclaration(parsed.milkDeclaration || null);
          setCrossContaminationType(parsed.crossContaminationType || 'NENHUM');
          if (parsed.images && Array.isArray(parsed.images)) {
            setImages(parsed.images);
          } else if (parsed.imageUrl) {
            setImages([{ url: parsed.imageUrl, imageType: 'PRODUCT', isCover: true, displayOrder: 0 }]);
          }
          if (parsed.declaredAllergens) setDeclaredAllergens(parsed.declaredAllergens);
          if (parsed.crossContaminationDetails) setCrossContaminationDetails(parsed.crossContaminationDetails);
          if (parsed.dietaryFeatures) setDietaryFeatures(parsed.dietaryFeatures);
          if (parsed.informationOrigin) setInformationOrigin(parsed.informationOrigin);
          if (parsed.nutritionalInfo) setNutritionalInfo(parsed.nutritionalInfo);
          if (parsed.certifications) setCertifications(parsed.certifications);
          setLastAutoSaved(parsed.savedAt || null);
        }
      }
    } catch {
      // Ignora falhas de leitura do storage
    }
  }, [isOpen, token, initialPartnerId, fetchCategories, draftStorageKey]);

  // Sincronização entre Matriz de Alérgenos e seletores rápidos de Glúten e Leite
  const handleAllergenMatrixChange = useCallback((updated: Record<string, AllergenPresence>) => {
    setDeclaredAllergens(updated);
    if (updated['GLUTEN'] === 'CONTAINS') {
      setHasGluten(true);
    } else if (updated['GLUTEN'] === 'FREE') {
      setHasGluten(false);
    }
    if (updated['MILK'] === 'CONTAINS') {
      setMilkDeclaration('CONTAINS');
    } else if (updated['MILK'] === 'FREE') {
      setMilkDeclaration('FREE');
    } else if (updated['MILK'] === 'TRACES') {
      setMilkDeclaration('TRACES');
    }
  }, []);

  const handleToggleGluten = () => {
    const next = !hasGluten;
    setHasGluten(next);
    setDeclaredAllergens((prev) => ({
      ...prev,
      GLUTEN: next ? 'CONTAINS' : 'FREE',
    }));
  };

  const handleSetMilkDeclaration = (decl: 'FREE' | 'CONTAINS' | 'TRACES') => {
    setMilkDeclaration(decl);
    setDeclaredAllergens((prev) => ({
      ...prev,
      MILK: decl,
    }));
  };

  // Auto-save local a cada 1.5s se houver alterações
  useEffect(() => {
    if (!isOpen || !name.trim()) return;

    const timeout = setTimeout(() => {
      try {
        const draftData = {
          name,
          brand,
          category,
          price,
          shortDescription,
          netContent,
          unitOfMeasure,
          sku,
          ean,
          commercialOrigin,
          ingredients,
          mayContainTraces,
          compositionNotes,
          hasGluten,
          milkDeclaration,
          crossContaminationType,
          images,
          imageUrl: images.find((img) => img.isCover)?.url || images[0]?.url || '',
          declaredAllergens,
          crossContaminationDetails,
          dietaryFeatures,
          informationOrigin,
          nutritionalInfo,
          certifications,
          savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        localStorage.setItem(draftStorageKey, JSON.stringify(draftData));
        setLastAutoSaved(draftData.savedAt);
      } catch {
        // Ignora erros de cota do localStorage
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [
    isOpen, name, brand, category, price, shortDescription, netContent, unitOfMeasure,
    sku, ean, commercialOrigin, ingredients, mayContainTraces, compositionNotes,
    hasGluten, milkDeclaration, crossContaminationType, images,
    declaredAllergens, crossContaminationDetails, dietaryFeatures, informationOrigin,
    nutritionalInfo, certifications, draftStorageKey
  ]);

  const clearLocalDraft = () => {
    try {
      localStorage.removeItem(draftStorageKey);
      setLastAutoSaved(null);
      toast.info('Rascunho local limpo com sucesso.', 'Rascunho');
    } catch {
      // Ignora
    }
  };

  if (!isOpen) return null;

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
        { name: newCategoryName.trim(), partnerId: partnerTargetId },
        token
      );
      setCategories((prev) => {
        const exists = prev.some((c) => c.normalizedName === created.normalizedName);
        if (exists) return prev;
        return [created, ...prev];
      });
      setCategory(created.name);
      setNewCategoryName('');
      setIsAddingCustomCategory(false);
      toast.info('Nova categoria registrada e disponível para este produto.', 'Categoria Registrada');
    } catch (err: any) {
      const msg = err instanceof HttpError ? err.message : err?.message || 'Erro ao registrar nova categoria.';
      toast.error(msg, 'Erro');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleSave = async (statusToSave: PublicationStatus) => {
    if (!isAuthenticated || !token) {
      toast.error('Você precisa estar autenticado para salvar ou publicar produtos.', 'Erro de Autenticação');
      return;
    }

    if (!partnerTargetId) {
      toast.error('Selecione um estabelecimento produtor/fornecedor para o produto.', 'Estabelecimento Obrigatório');
      return;
    }

    if (!name.trim()) {
      toast.error('O nome do produto é obrigatório.', 'Nome Obrigatório');
      return;
    }

    // Se estiver publicando no catálogo, validações estritas de segurança alimentar
    if (statusToSave === 'PUBLISHED') {
      if (!ingredients.trim()) {
        toast.error('A lista de ingredientes é obrigatória para publicar o produto no catálogo.', 'Ingredientes Obrigatórios');
        return;
      }

      if (!milkDeclaration) {
        toast.error('Selecione a declaração de Leite e Derivados (Sem Leite, Contém Leite ou Traços).', 'Declaração Obrigatória');
        return;
      }

      if (ean.trim() && !/^\d{8,14}$/.test(ean.trim())) {
        toast.error('O código de barras (EAN) deve conter entre 8 e 14 dígitos numéricos.', 'EAN Inválido');
        return;
      }
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
      }

      const resolvedCoverUrl = coverImage?.url?.trim() || undefined;

      const payload: CreateProductInput = {
        name: name.trim(),
        brand: brand.trim() || initialPartnerName || 'Própria',
        ingredients: finalIngredients,
        hasGluten,
        crossContamination: finalCrossContamination,
        partnerId: partnerTargetId,
        category: category.trim(),
        price: price ? parseFloat(price) : undefined,
        imageUrl: resolvedCoverUrl,
        images: images.length > 0 ? images : undefined,
        shortDescription: shortDescription.trim() || undefined,
        netContent: netContent ? parseFloat(netContent) : undefined,
        unitOfMeasure: netContent ? unitOfMeasure : undefined,
        sku: sku.trim() || undefined,
        ean: ean.trim() || undefined,
        commercialOrigin,
        mayContainTraces: mayContainTraces.trim() || undefined,
        compositionNotes: compositionNotes.trim() || undefined,
        publicationStatus: statusToSave,
        declaredAllergens: Object.keys(declaredAllergens).length > 0 ? declaredAllergens : undefined,
        crossContaminationDetails: crossContaminationDetails.environmentRisk ? crossContaminationDetails : undefined,
        dietaryFeatures: dietaryFeatures.length > 0 ? dietaryFeatures : undefined,
        informationOrigin: informationOrigin || 'PARTNER_DECLARED',
        nutritionalInfo: Object.keys(nutritionalInfo).length > 0 ? nutritionalInfo : undefined,
        certifications: certifications.length > 0 ? certifications : undefined,
      };

      await catalogApi.create(payload, token);

      // Limpar rascunho salvo localmente
      try {
        localStorage.removeItem(draftStorageKey);
      } catch {}

      if (statusToSave === 'PUBLISHED') {
        toast.success('Produto publicado com sucesso no catálogo!', 'Publicado');
      } else {
        toast.info('Rascunho salvo com sucesso! Você pode continuar a edição a qualquer momento.', 'Rascunho Salvo');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      const msg = err instanceof HttpError ? err.message : err?.message || 'Erro ao processar o produto.';
      toast.error(msg, 'Erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '0.75rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface, #ffffff)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '1100px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: theme === 'dark'
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px var(--color-border)'
            : '0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--color-border)',
          color: 'var(--color-text)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Drawer/Modal */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--color-border)',
            background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'var(--color-surface)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📦</span>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
                Publicar Produto no Catálogo
              </h2>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                Fases 1 & 2 • Ficha Técnica & Galeria
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Cadastre itens com origem, especificação técnica detalhada, segurança contra alérgenos e galeria de fotos.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {lastAutoSaved && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                💾 Auto-salvo às {lastAutoSaved}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                lineHeight: 1,
                padding: '0.4rem 0.65rem',
                transition: 'all 0.15s ease',
              }}
              title="Fechar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navegação por Etapas Mobile (< 820px) */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            background: theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'var(--color-elevated)',
            overflowX: 'auto',
          }}
          className="mobile-step-nav"
        >
          {[
            { id: 1, label: '1. Identificação' },
            { id: 2, label: '2. Fotos & Galeria' },
            { id: 3, label: '3. Ingredientes & Alérgenos' },
            { id: 4, label: '4. Ambiente & Certificações' },
            { id: 5, label: '5. Revisão & Publicação' },
          ].map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStepMobile(step.id)}
              style={{
                flex: 1,
                padding: '0.65rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: activeStepMobile === step.id ? 700 : 500,
                color: activeStepMobile === step.id ? '#10b981' : 'var(--color-text-muted)',
                background: 'transparent',
                border: 'none',
                borderBottom: activeStepMobile === step.id ? '2px solid #10b981' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {step.label}
            </button>
          ))}
        </div>

        {/* Corpo com Layout de 2 Colunas no Desktop */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 340px',
            flex: 1,
            overflowY: 'auto',
            gap: '1.5rem',
            padding: '1.5rem 1.75rem',
          }}
          className="create-product-grid"
        >
          {/* ================= COLUNA PRINCIPAL (~65%) ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Bloco: Estabelecimento & Origem Comercial */}
            <div
              className={`product-form-section ${activeStepMobile === 1 ? 'mobile-active-step' : 'mobile-hidden-step'}`}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {!initialPartnerId && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    🏢 Estabelecimento Produtor / Fornecedor *
                  </label>
                  {loadingPartners ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Carregando seus estabelecimentos…</p>
                  ) : partners.length === 0 ? (
                    <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', fontSize: '0.85rem', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
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
                        border: '1px solid var(--color-border)',
                        background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                        color: 'var(--color-text)',
                        fontSize: '0.85rem',
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

              {/* Origem Comercial: Fabricação Própria vs Revenda */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  🏷️ Origem Comercial do Produto *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setCommercialOrigin('OWN_MANUFACTURE')}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.6rem',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '10px',
                      border: commercialOrigin === 'OWN_MANUFACTURE' ? '2px solid #10b981' : '1px solid var(--color-border)',
                      background: commercialOrigin === 'OWN_MANUFACTURE' ? 'rgba(16, 185, 129, 0.12)' : (theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'var(--color-elevated)'),
                      color: 'var(--color-text)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>🏭</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: commercialOrigin === 'OWN_MANUFACTURE' ? '#10b981' : 'inherit' }}>
                        Fabricação Própria
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        Produzido no próprio local / receitas artesanais da casa.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommercialOrigin('THIRD_PARTY_RESELL')}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.6rem',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '10px',
                      border: commercialOrigin === 'THIRD_PARTY_RESELL' ? '2px solid #3b82f6' : '1px solid var(--color-border)',
                      background: commercialOrigin === 'THIRD_PARTY_RESELL' ? 'rgba(59, 130, 246, 0.12)' : (theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'var(--color-elevated)'),
                      color: 'var(--color-text)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📦</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: commercialOrigin === 'THIRD_PARTY_RESELL' ? '#3b82f6' : 'inherit' }}>
                        Revenda / Fornecido por Terceiro
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        Item industrializado/embalado por outro fabricante.
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Bloco: Identificação do Produto */}
            <div
              className={`product-form-section ${activeStepMobile === 1 ? 'mobile-active-step' : 'mobile-hidden-step'}`}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                📋 Identificação do Produto
              </h4>

              {/* Nome & Marca */}
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
                      border: '1px solid var(--color-border)',
                      background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                      color: 'var(--color-text)',
                      fontSize: '0.85rem',
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
                    placeholder="Ex: Receita da Casa / CeliFood"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                      color: 'var(--color-text)',
                      fontSize: '0.85rem',
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
                          color: '#10b981',
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
                        border: '1px solid var(--color-border)',
                        background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                        color: 'var(--color-text)',
                        fontSize: '0.85rem',
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
                        borderRadius: '8px',
                        border: '1px solid #10b981',
                        background: 'rgba(16, 185, 129, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Nome da categoria..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.4rem',
                          borderRadius: '6px',
                          border: '1px solid var(--color-border)',
                          background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                          color: 'var(--color-text)',
                          fontSize: '0.8rem',
                        }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => { setIsAddingCustomCategory(false); setNewCategoryName(''); }}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateCategorySubmit}
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', background: '#10b981', border: 'none', borderRadius: '4px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                          disabled={creatingCategory || !newCategoryName.trim()}
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Preço Sugerido / Unitário (R$)
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
                      border: '1px solid var(--color-border)',
                      background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                      color: 'var(--color-text)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              {/* Quantidade Líquida/Peso + Unidade de Medida */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Peso Líquido / Volume
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Ex: 500"
                      value={netContent}
                      onChange={(e) => setNetContent(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.65rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                        color: 'var(--color-text)',
                        fontSize: '0.85rem',
                      }}
                    />
                    <select
                      value={unitOfMeasure}
                      onChange={(e) => setUnitOfMeasure(e.target.value)}
                      style={{
                        width: '130px',
                        padding: '0.65rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                        color: 'var(--color-text)',
                        fontSize: '0.85rem',
                      }}
                    >
                      {UNITS_OF_MEASURE.map((u) => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Descrição Curta
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Pão fatiado macio com sementes e aroma suave"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                      color: 'var(--color-text)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              {/* SKU & EAN */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Código Interno / SKU (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: PAO-MAN-500"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                      color: 'var(--color-text)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Código de Barras / EAN (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 7891234567890 (8 a 14 dígitos)"
                    value={ean}
                    onChange={(e) => setEan(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                      color: 'var(--color-text)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Bloco: Galeria de Imagens & Rótulos (Fase 2) */}
            <div
              className={`product-form-section ${activeStepMobile === 2 ? 'mobile-active-step' : 'mobile-hidden-step'}`}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <ProductImageGalleryUploader
                images={images}
                onChange={setImages}
                maxImages={8}
                disabled={loading}
              />
            </div>

            {/* Bloco: Ingredientes & Composição (Etapa 3) */}
            <div
              className={`product-form-section ${activeStepMobile === 3 ? 'mobile-active-step' : 'mobile-hidden-step'}`}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🥣 Ingredientes & Matriz de Alérgenos
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                  RDC 727/2022 ANVISA
                </span>
              </div>

              {/* Lista Completa de Ingredientes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Lista Completa de Ingredientes (conforme rótulo) *
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Polvilho doce, farinha de mandioca, água, ovos, óleo de girassol, sal marinho, fermento biológico."
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                    color: 'var(--color-text)',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                  }}
                  required
                />
                <small style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px', display: 'block' }}>
                  🛡️ Processado pelo motor de segurança alimentar para alertar contra alérgenos da formulação.
                </small>
              </div>

              {/* Declaração "Pode Conter" (RDC 727/2022) */}
              <div
                style={{
                  padding: '0.9rem',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.35rem' }}>
                  ⚠️ Declaração "Pode Conter..." (Traços / Alérgenos por Contato Cruzado)
                </label>
                <input
                  type="text"
                  placeholder="Ex: ALÉRGICOS: PODE CONTER SOJA, LEITE, CASTANHAS E AMENDOIM"
                  value={mayContainTraces}
                  onChange={(e) => setMayContainTraces(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                    color: 'var(--color-text)',
                    fontSize: '0.85rem',
                  }}
                />
                <small style={{ fontSize: '0.72rem', color: '#fbbf24', marginTop: '4px', display: 'block', lineHeight: 1.4 }}>
                  Campo obrigatório no Brasil pela ANVISA (RDC 727/2022) caso haja risco de traços na linha de produção.
                </small>
              </div>

              {/* Matriz Oficial de Alérgenos (Fase 3) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <div>
                  <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    🏷️ Matriz Declarada de Alérgenos (10 Alérgenos ANVISA)
                  </h5>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Selecione o estado de cada alérgeno: Livre, Contém ou Pode Conter Traços. O CeLiLac gera os selos automáticos.
                  </p>
                </div>
                <AllergenSafetyMatrix
                  value={declaredAllergens}
                  onChange={handleAllergenMatrixChange}
                  disabled={loading}
                />
              </div>

              {/* Observações de Composição */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Observações Técnicas de Composição (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Não utiliza conservantes artificiais; fermentação natural de 12 horas."
                  value={compositionNotes}
                  onChange={(e) => setCompositionNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                    color: 'var(--color-text)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>

            {/* Bloco: Isolamento de Ambiente, Estilos & Certificações (Etapa 4) */}
            <div
              className={`product-form-section ${activeStepMobile === 4 ? 'mobile-active-step' : 'mobile-hidden-step'}`}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🛡️ Ambiente, Estilos de Vida & Certificações
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                  Fase 3 • Auditoria Técnica
                </span>
              </div>

              {/* 1. Seleção Rápida de Glúten e Leite com Sincronização */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  Declarações Diretas (Sincronizadas com a Matriz)
                </label>

                {/* Glúten */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.85rem',
                    borderRadius: '10px',
                    background: theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>
                      {hasGluten ? '🔴 Produto Contém Glúten' : '🟢 Produto Livre de Glúten (Sem Glúten)'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {hasGluten
                        ? 'Possui trigo, centeio, cevada ou aveia na formulação.'
                        : 'Isento de glúten na receita e ingredientes.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleGluten}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      background: hasGluten ? '#ef4444' : '#10b981',
                      color: '#fff',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {hasGluten ? 'Alterar p/ Sem Glúten' : 'Alterar p/ Contém Glúten'}
                  </button>
                </div>

                {/* Leite e Derivados */}
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
                    <button
                      type="button"
                      onClick={() => handleSetMilkDeclaration('FREE')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '0.65rem 0.75rem',
                        borderRadius: '8px',
                        border: milkDeclaration === 'FREE' ? '2px solid #10b981' : '1px solid var(--color-border)',
                        background: milkDeclaration === 'FREE' ? 'rgba(16, 185, 129, 0.12)' : (theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'var(--color-elevated)'),
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: milkDeclaration === 'FREE' ? '#10b981' : 'var(--color-text)' }}>
                        🟢 Sem Leite nem Traços
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        100% Livre (Apto p/ APLV)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetMilkDeclaration('CONTAINS')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '0.65rem 0.75rem',
                        borderRadius: '8px',
                        border: milkDeclaration === 'CONTAINS' ? '2px solid #ef4444' : '1px solid var(--color-border)',
                        background: milkDeclaration === 'CONTAINS' ? 'rgba(239, 68, 68, 0.12)' : (theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'var(--color-elevated)'),
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: milkDeclaration === 'CONTAINS' ? '#ef4444' : 'var(--color-text)' }}>
                        🥛 Contém Leite
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        Possui leite na composição
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetMilkDeclaration('TRACES')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '0.65rem 0.75rem',
                        borderRadius: '8px',
                        border: milkDeclaration === 'TRACES' ? '2px solid #f59e0b' : '1px solid var(--color-border)',
                        background: milkDeclaration === 'TRACES' ? 'rgba(245, 158, 11, 0.12)' : (theme === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'var(--color-elevated)'),
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: milkDeclaration === 'TRACES' ? '#f59e0b' : 'var(--color-text)' }}>
                        ⚠️ Traços de Leite
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        Risco de contato cruzado
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Seletor Avançado de Contaminação Cruzada */}
              <div>
                <CrossContaminationSelector
                  value={crossContaminationDetails}
                  onChange={setCrossContaminationDetails}
                  disabled={loading}
                />
              </div>

              {/* 3. Estilos de Vida & Dietas Especiais */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text)' }}>
                  🌱 Estilos de Vida & Características Alimentares
                </label>
                <DietaryFeaturesPicker
                  selected={dietaryFeatures}
                  onChange={setDietaryFeatures}
                  disabled={loading}
                />
              </div>

              {/* 4. Gerenciador de Selos e Certificações Oficiais */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text)' }}>
                  🏅 Selos Oficiais, Certificados e Laudos Laboratoriais
                </label>
                <ProductCertificationsManager
                  certifications={certifications}
                  onChange={setCertifications}
                  availableImages={images}
                  disabled={loading}
                />
              </div>

              {/* 5. Tabela Nutricional ANVISA (Accordion Opcional) */}
              <div>
                <NutritionalInfoAccordion
                  value={nutritionalInfo}
                  onChange={setNutritionalInfo}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* ================= COLUNA LATERAL DE APOIO (~35%) (Etapa 5 no Mobile) ================= */}
          <div
            className={`lateral-column ${activeStepMobile === 5 ? 'mobile-active-step' : 'mobile-hidden-step'}`}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {/* Card 1: Ações de Publicação */}
            <div
              style={{
                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'var(--color-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>
                🚀 Ações da Publicação
              </h4>

              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                Você pode salvar o progresso para finalizar mais tarde ou publicar diretamente no catálogo.
              </p>

              <button
                type="button"
                onClick={() => handleSave('PUBLISHED')}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  background: '#10b981',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                {loading ? 'Processando…' : '🚀 Publicar no Catálogo'}
              </button>

              <button
                type="button"
                onClick={() => handleSave('DRAFT')}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '10px',
                  background: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  border: '1px solid var(--color-border)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                💾 Salvar como Rascunho
              </button>

              {lastAutoSaved && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#10b981' }}>✓ Rascunho salvo ({lastAutoSaved})</span>
                  <button
                    type="button"
                    onClick={clearLocalDraft}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.68rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Descartar
                  </button>
                </div>
              )}
            </div>

            {/* Card 2: Live Preview (Ficha Técnica em Tempo Real) */}
            <div
              style={{
                background: theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'var(--color-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  👁️ Prévia do Consumidor
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: commercialOrigin === 'OWN_MANUFACTURE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                    color: commercialOrigin === 'OWN_MANUFACTURE' ? '#10b981' : '#3b82f6',
                    fontWeight: 700,
                  }}
                >
                  {commercialOrigin === 'OWN_MANUFACTURE' ? 'Próprio' : 'Revenda'}
                </span>
              </div>

              {/* Thumbnail da Capa na Prévia */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '140px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: theme === 'dark' ? '#020617' : 'rgba(0, 0, 0, 0.04)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {coverImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImage.url}
                      alt={name || 'Capa do Produto'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '6px',
                        right: '6px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(4px)',
                        color: '#fff',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '4px',
                      }}
                    >
                      📷 {images.length} {images.length === 1 ? 'foto' : 'fotos'}
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                    <span style={{ fontSize: '1.4rem' }}>📷</span>
                    <span style={{ fontSize: '0.72rem' }}>Sem fotos cadastradas</span>
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>
                  {name || 'Nome do Produto'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {brand || 'Marca'} • {category}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
                  {price ? `R$ ${parseFloat(price).toFixed(2)}` : 'R$ 0,00'}
                </span>
                {netContent && (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    ({netContent} {unitOfMeasure})
                  </span>
                )}
              </div>

              {/* Badges de Segurança na Prévia */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    background: hasGluten ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: hasGluten ? '#ef4444' : '#10b981',
                  }}
                >
                  {hasGluten ? '🔴 COM GLÚTEN' : '🟢 SEM GLÚTEN'}
                </span>

                {milkDeclaration && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      background: milkDeclaration === 'FREE' ? 'rgba(16, 185, 129, 0.2)' : milkDeclaration === 'CONTAINS' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: milkDeclaration === 'FREE' ? '#10b981' : milkDeclaration === 'CONTAINS' ? '#ef4444' : '#f59e0b',
                    }}
                  >
                    {milkDeclaration === 'FREE' ? '🟢 SEM LEITE' : milkDeclaration === 'CONTAINS' ? '🥛 COM LEITE' : '⚠️ TRAÇOS LEITE'}
                  </span>
                )}

                {Object.values(declaredAllergens).filter((v) => v === 'FREE').length > 0 && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    ✓ {Object.values(declaredAllergens).filter((v) => v === 'FREE').length} Alérgenos Livres
                  </span>
                )}

                {dietaryFeatures.map((f) => (
                  <span
                    key={f}
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      background: 'rgba(52, 211, 153, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                    }}
                  >
                    🌱 {f === 'VEGAN' ? 'Vegano' : f === 'ORGANIC' ? 'Orgânico' : f === 'NO_ADDED_SUGAR' ? 'Sem Açúcar Adic.' : f}
                  </span>
                ))}

                {certifications.map((c, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#818cf8',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    🏅 {c.certifyingEntity}
                  </span>
                ))}
              </div>

              {mayContainTraces && (
                <div style={{ fontSize: '0.72rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '6px', borderRadius: '6px', lineHeight: 1.3 }}>
                  <strong>Alerta de Traços:</strong> {mayContainTraces}
                </div>
              )}

              {nutritionalInfo?.calories !== undefined && (
                <div style={{ fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.08)', padding: '6px', borderRadius: '6px', lineHeight: 1.3 }}>
                  📊 <strong>{nutritionalInfo.calories} kcal</strong> {nutritionalInfo.servingSize ? `(porção ${nutritionalInfo.servingSize})` : ''}
                </div>
              )}
            </div>

            {/* Card 3: Resumo da Galeria & Documentação Visual (Fase 2) */}
            <div
              style={{
                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'var(--color-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  📸 Documentação Visual
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                  {images.length}/8 fotos
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>🏷️ Rótulo Frontal:</span>
                  <span style={{ fontWeight: 600, color: images.some((i) => i.imageType === 'LABEL') ? '#10b981' : '#94a3b8' }}>
                    {images.some((i) => i.imageType === 'LABEL') ? '✓ Anexado' : 'Opcional'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>🥣 Ingredientes (RDC 727):</span>
                  <span style={{ fontWeight: 600, color: images.some((i) => i.imageType === 'INGREDIENTS') ? '#10b981' : '#94a3b8' }}>
                    {images.some((i) => i.imageType === 'INGREDIENTS') ? '✓ Anexado' : 'Opcional'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>📦 Embalagem / Produto:</span>
                  <span style={{ fontWeight: 600, color: images.some((i) => i.imageType === 'PRODUCT' || i.imageType === 'PACKAGING') ? '#10b981' : '#94a3b8' }}>
                    {images.some((i) => i.imageType === 'PRODUCT' || i.imageType === 'PACKAGING') ? '✓ Anexado' : 'Opcional'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>🏅 Laudo / Certificação:</span>
                  <span style={{ fontWeight: 600, color: certifications.length > 0 || images.some((i) => i.imageType === 'CERTIFICATION') ? '#10b981' : '#94a3b8' }}>
                    {certifications.length > 0 ? `✓ ${certifications.length} selo(s)` : 'Opcional'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveStepMobile(2)}
                style={{
                  width: '100%',
                  padding: '0.45rem',
                  borderRadius: '6px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#38bdf8',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Gerenciar Fotos na Galeria ↗
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé / Barra de Ação Mobile & Desktop */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid var(--color-border)',
            background: theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'var(--color-surface)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1.1rem',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>

            {/* Botão Voltar (Mobile) */}
            {activeStepMobile > 1 && (
              <button
                type="button"
                onClick={() => setActiveStepMobile((prev) => Math.max(1, prev - 1))}
                className="mobile-step-nav-btn"
                style={{
                  padding: '0.55rem 0.9rem',
                  borderRadius: '8px',
                  background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'var(--color-elevated)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                ← Anterior
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => handleSave('DRAFT')}
              disabled={loading}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'var(--color-elevated)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Salvar Rascunho
            </button>

            {/* Avançar Próxima Etapa no Mobile */}
            {activeStepMobile < 5 && (
              <button
                type="button"
                onClick={() => setActiveStepMobile((prev) => Math.min(5, prev + 1))}
                className="mobile-step-nav-btn"
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '8px',
                  background: '#3b82f6',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Próximo →
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSave('PUBLISHED')}
              disabled={loading}
              className={activeStepMobile < 5 ? 'desktop-only-publish-btn' : ''}
              style={{
                padding: '0.55rem 1.3rem',
                borderRadius: '8px',
                background: '#10b981',
                border: 'none',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {loading ? 'Publicando…' : '🚀 Publicar Produto'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.97);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @media (max-width: 820px) {
          .create-product-grid {
            grid-template-columns: 1fr !important;
          }
          .mobile-step-nav {
            display: flex !important;
          }
          .mobile-hidden-step {
            display: none !important;
          }
          .mobile-active-step {
            display: flex !important;
          }
          .desktop-only-publish-btn {
            display: none !important;
          }
          .mobile-step-nav-btn {
            display: inline-block !important;
          }
        }
        @media (min-width: 821px) {
          .mobile-step-nav {
            display: none !important;
          }
          .mobile-hidden-step,
          .mobile-active-step {
            display: flex !important;
          }
          .desktop-only-publish-btn {
            display: inline-flex !important;
          }
          .mobile-step-nav-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

