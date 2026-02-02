import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Utensils, Flame, ArrowLeft, TrendingUp, Clock, Search, Package, Tag, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { NutritionEntry, CreateNutritionRequest, NutritionProduct, CreateNutritionProductRequest } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useNutrition } from '../hooks/useNutrition';
import { nutritionAPI, uploadsAPI } from '../lib/api';

const Nutrition: React.FC = () => {
    const { t, language } = useLanguage();
    const { addEntry, updateEntry, deleteEntry, getEntries, getDailySummary, loading, error, refreshEntries } = useNutrition();
    const [isCreating, setIsCreating] = useState(false);
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);
    const [editingProduct, setEditingProduct] = useState<NutritionProduct | null>(null);
    const [showProducts, setShowProducts] = useState(true);
    const [editingEntry, setEditingEntry] = useState<NutritionEntry | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<NutritionProduct[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productsError, setProductsError] = useState<string | null>(null);

    // Product form states
    const [productName, setProductName] = useState('');
    const [productAssessment, setProductAssessment] = useState<'positive' | 'negative' | 'neutral'>('neutral');
    const [productPros, setProductPros] = useState('');
    const [productCons, setProductCons] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [productPhotoUrl, setProductPhotoUrl] = useState('');
    const [productPhotoUploading, setProductPhotoUploading] = useState(false);
    const rawApiBaseUrl = import.meta.env.VITE_API_URL as string | undefined;
    const normalizedApiBaseUrl = rawApiBaseUrl ? rawApiBaseUrl.replace(/\/$/, '') : '';
    const uploadsBaseUrl = normalizedApiBaseUrl
        ? (normalizedApiBaseUrl.endsWith('/api') ? normalizedApiBaseUrl.slice(0, -4) : normalizedApiBaseUrl)
        : '';
    const apiBaseUrl = normalizedApiBaseUrl
        ? (normalizedApiBaseUrl.endsWith('/api') ? normalizedApiBaseUrl : `${normalizedApiBaseUrl}/api`)
        : '/api';

    // Загружаем данные при изменении выбранной даты
    useEffect(() => {
        refreshEntries(selectedDate);
    }, [selectedDate, refreshEntries]);

    const loadProducts = async () => {
        try {
            setProductsLoading(true);
            setProductsError(null);
            const data = await nutritionAPI.getProducts();
            setProducts(data);
        } catch (e) {
            setProductsError(e instanceof Error ? e.message : 'Failed to load products');
        } finally {
            setProductsLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const addProduct = async (productData: CreateNutritionProductRequest) => {
        const created = await nutritionAPI.createProduct(productData);
        setProducts((prev) => [...prev, created]);
    };

    const updateProduct = async (id: number, productData: CreateNutritionProductRequest) => {
        const updated = await nutritionAPI.updateProduct(id, productData);
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    };

    const deleteProduct = async (id: number) => {
        await nutritionAPI.deleteProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    const filteredEntries = useMemo(() => {
        const base = getEntries(selectedDate);
        if (!searchTerm) return base;
        const q = searchTerm.toLowerCase();
        return base.filter(entry => entry.title.toLowerCase().includes(q));
    }, [getEntries, selectedDate, searchTerm]);
    const summary = getDailySummary(selectedDate);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateNutritionRequest>();

    useEffect(() => {
        if (isCreating && !editingEntry) {
            reset({
                date: selectedDate,
                time: new Date().toTimeString().slice(0, 5)
            });
        }
    }, [isCreating, selectedDate, reset, editingEntry]);

    const onSubmit = async (data: CreateNutritionRequest) => {
        const submitData = { ...data, date: selectedDate };

        try {
            if (editingEntry) {
                await updateEntry(editingEntry.id, submitData);
            } else {
                await addEntry(submitData);
            }

            await refreshEntries(selectedDate);
            reset();
            setIsCreating(false);
            setEditingEntry(null);
        } catch (error) {
            console.error('Error saving nutrition entry:', error);
        }
    };

    const handleEdit = (entry: NutritionEntry) => {
        setEditingEntry(entry);
        reset({
            date: entry.date,
            time: entry.time,
            title: entry.title,
            calories: entry.calories,
            proteins: entry.proteins,
            fats: entry.fats,
            carbs: entry.carbs
        });
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(language === 'en' ? 'Are you sure?' : 'Вы уверены?')) {
            try {
                await deleteEntry(id);
                await refreshEntries(selectedDate);
            } catch (error) {
                console.error('Error deleting nutrition entry:', error);
            }
        }
    };

    const handleProductPhotoUpload = async (file?: File) => {
        if (!file) return;
        try {
            setProductPhotoUploading(true);
            const result = await uploadsAPI.upload(file);
            setProductPhotoUrl(result.url);
        } catch (error) {
            console.error('Product photo upload failed:', error);
        } finally {
            setProductPhotoUploading(false);
        }
    };

    const normalizePhotoUrl = (url?: string | null) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        if (url.startsWith('/uploads')) {
            return uploadsBaseUrl ? `${uploadsBaseUrl}${url}` : url;
        }
        if (url.startsWith('uploads/')) {
            return uploadsBaseUrl ? `${uploadsBaseUrl}/${url}` : `/${url}`;
        }
        return `${apiBaseUrl}/telegram-files?file_id=${encodeURIComponent(url)}`;
    };

    const getProductPhotoUrls = (product: NutritionProduct) => {
        const rawUrls = Array.isArray(product.photo_urls) && product.photo_urls.length
            ? product.photo_urls
            : product.photo_url
                ? [product.photo_url]
                : [];
        return rawUrls
            .map((url) => normalizePhotoUrl(url))
            .filter((url): url is string => Boolean(url))
            .slice(0, 3);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-indigo-900">
            <div className="max-w-4xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/"
                            className="inline-flex items-center text-white/80 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            {language === 'en' ? 'Back' : 'Назад'}
                        </Link>
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">{t('nutrition')}</h1>
                            <p className="text-white/80">{t('welcome')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-white/10 backdrop-blur-lg border border-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>{t('addEntry')}</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 mb-8">
                    <div className="flex items-center space-x-4">
                        <Search className="w-5 h-5 text-white/60" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={language === 'en' ? 'Search entries...' : 'Поиск записей...'}
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                    </div>
                </div>

                {/* Daily Summary */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <TrendingUp className="w-6 h-6 mr-2" />
                        {t('dailySummary')}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <Flame className="w-5 h-5 text-white" />
                                <span className="text-white/80 text-sm">{t('calories')}</span>
                            </div>
                            <div className="text-2xl font-bold text-white">{summary.totalCalories}</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-4">
                            <div className="text-white/80 text-sm mb-2">{t('proteins')}</div>
                            <div className="text-2xl font-bold text-white">{summary.totalProteins}g</div>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-4">
                            <div className="text-white/80 text-sm mb-2">{t('fats')}</div>
                            <div className="text-2xl font-bold text-white">{summary.totalFats}g</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-xl p-4">
                            <div className="text-white/80 text-sm mb-2">{t('carbs')}</div>
                            <div className="text-2xl font-bold text-white">{summary.totalCarbs}g</div>
                        </div>
                    </div>
                </div>

                {/* Products Section */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center">
                            <Package className="w-6 h-6 mr-2" />
                            {language === 'en' ? 'Products' : 'Продукты'}
                        </h2>
                        <div className="flex items-center space-x-2">
                            <button
                                type="button"
                                onClick={() => setShowProducts((prev) => !prev)}
                                className="bg-white/10 text-white px-3 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center"
                            >
                                {showProducts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => {
                                    setIsCreatingProduct(true);
                                    setShowProducts(true);
                                }}
                                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {language === 'en' ? 'Add Product' : 'Добавить продукт'}
                            </button>
                        </div>
                    </div>

                    {showProducts && (
                        <>
                            {productsLoading && (
                                <div className="text-white/60 text-sm mb-4">
                                    {language === 'en' ? 'Loading products...' : 'Загрузка продуктов...'}
                                </div>
                            )}

                            {productsError && (
                                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                                    <p className="text-red-200 text-sm">{productsError}</p>
                                    <button
                                        onClick={loadProducts}
                                        className="mt-2 text-red-200 hover:text-white underline text-sm"
                                    >
                                        {language === 'en' ? 'Try again' : 'Попробовать снова'}
                                    </button>
                                </div>
                            )}

                            {/* Add Product Form */}
                            {(isCreatingProduct || editingProduct) && (
                                <div className="bg-white/5 rounded-lg p-4 mb-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        {editingProduct
                                            ? (language === 'en' ? 'Edit Product' : 'Редактировать продукт')
                                            : (language === 'en' ? 'Add New Product' : 'Добавить новый продукт')}
                                    </h3>

                            <div>
                                <label className="block text-white/80 mb-2">
                                    {language === 'en' ? 'Product Name' : 'Название продукта'}
                                </label>
                                <input
                                    type="text"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                    placeholder={language === 'en' ? 'Enter product name...' : 'Введите название продукта...'}
                                />
                            </div>

                            <div>
                                <label className="block text-white/80 mb-2">
                                    {language === 'en' ? 'Assessment' : 'Оценка'}
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setProductAssessment('positive')}
                                        className={`px-4 py-3 rounded-lg transition-colors flex items-center justify-center ${productAssessment === 'positive'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                                            }`}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        {language === 'en' ? 'Positive' : 'Положительный'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setProductAssessment('neutral')}
                                        className={`px-4 py-3 rounded-lg transition-colors flex items-center justify-center ${productAssessment === 'neutral'
                                            ? 'bg-yellow-500 text-white'
                                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30'
                                            }`}
                                    >
                                        <Tag className="w-4 h-4 mr-2" />
                                        {language === 'en' ? 'Neutral' : 'Средний'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setProductAssessment('negative')}
                                        className={`px-4 py-3 rounded-lg transition-colors flex items-center justify-center ${productAssessment === 'negative'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                                            }`}
                                    >
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        {language === 'en' ? 'Negative' : 'Отрицательный'}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white/80 mb-2">
                                        {language === 'en' ? 'Pros' : 'Плюсы продукта'}
                                    </label>
                                    <input
                                        type="text"
                                        value={productPros}
                                        onChange={(e) => setProductPros(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                        placeholder={language === 'en' ? 'Optional pros...' : 'Плюсы (необязательно)'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/80 mb-2">
                                        {language === 'en' ? 'Cons' : 'Минусы продукта'}
                                    </label>
                                    <input
                                        type="text"
                                        value={productCons}
                                        onChange={(e) => setProductCons(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                        placeholder={language === 'en' ? 'Optional cons...' : 'Минусы (необязательно)'}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-white/80 mb-2">
                                    {language === 'en' ? 'Description' : 'Описание продукта'}
                                </label>
                                <textarea
                                    value={productDescription}
                                    onChange={(e) => setProductDescription(e.target.value)}
                                    rows={3}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                    placeholder={language === 'en' ? 'Describe this product...' : 'Опишите продукт...'}
                                />
                            </div>

                            <div>
                                <label className="block text-white/80 mb-2">
                                    {language === 'en' ? 'Photo URL (optional)' : 'Ссылка на фото (необязательно)'}
                                </label>
                                <input
                                    type="url"
                                    value={productPhotoUrl}
                                    onChange={(e) => setProductPhotoUrl(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                    placeholder="https://..."
                                />
                                <div className="mt-3">
                                    <label className="block text-white/60 text-sm mb-2">
                                        {language === 'en' ? 'Or upload from device' : 'Или загрузить с устройства'}
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleProductPhotoUpload(e.target.files?.[0])}
                                        className="block w-full text-white/70 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"
                                    />
                                    {productPhotoUploading && (
                                        <p className="text-white/60 text-sm mt-2">
                                            {language === 'en' ? 'Uploading...' : 'Загрузка...'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={async () => {
                                        if (productName.trim()) {
                                            const payload = {
                                                name: productName.trim(),
                                                assessment: productAssessment,
                                                notes: productDescription,
                                                pros: productPros,
                                                cons: productCons,
                                                photo_url: productPhotoUrl
                                            };

                                            if (editingProduct) {
                                                await updateProduct(editingProduct.id, payload);
                                            } else {
                                                await addProduct(payload);
                                            }

                                            setProductName('');
                                            setProductAssessment('neutral');
                                            setProductPros('');
                                            setProductCons('');
                                            setProductDescription('');
                                            setProductPhotoUrl('');
                                            setIsCreatingProduct(false);
                                            setEditingProduct(null);
                                        }
                                    }}
                                    className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                                >
                                    {editingProduct
                                        ? (language === 'en' ? 'Save' : 'Сохранить')
                                        : (language === 'en' ? 'Add Product' : 'Добавить продукт')}
                                </button>
                                <button
                                    onClick={() => {
                                        setProductName('');
                                        setProductAssessment('neutral');
                                        setProductPros('');
                                        setProductCons('');
                                        setProductDescription('');
                                        setProductPhotoUrl('');
                                        setIsCreatingProduct(false);
                                        setEditingProduct(null);
                                    }}
                                    className="bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    {language === 'en' ? 'Cancel' : 'Отмена'}
                                </button>
                            </div>
                                </div>
                            )}

                            {/* Products List */}
                            <div className="space-y-3">
                                {products.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
                                        <p className="text-white/60">
                                            {language === 'en'
                                                ? 'No products added yet. Add your first product above.'
                                                : 'Продукты еще не добавлены. Добавьте первый продукт выше.'}
                                        </p>
                                    </div>
                                ) : (
                                    products.map(product => (
                                        <div
                                            key={product.id}
                                            className={`bg-white/5 rounded-lg p-4 flex items-center justify-between ${product.assessment === 'positive'
                                                ? 'border-l-4 border-green-500'
                                                : product.assessment === 'negative'
                                                    ? 'border-l-4 border-red-500'
                                                    : 'border-l-4 border-yellow-500'
                                                }`}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h4 className="text-lg font-semibold text-white">{product.name}</h4>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.assessment === 'positive'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : product.assessment === 'negative'
                                                            ? 'bg-red-500/20 text-red-400'
                                                            : 'bg-yellow-500/20 text-yellow-400'
                                                        }`}>
                                                        {product.assessment === 'positive'
                                                            ? (language === 'en' ? 'Positive' : 'Положительный')
                                                            : product.assessment === 'negative'
                                                                ? (language === 'en' ? 'Negative' : 'Отрицательный')
                                                                : (language === 'en' ? 'Neutral' : 'Средний')}
                                                    </span>
                                                </div>
                                                {(product.notes || product.pros || product.cons || product.photo_url || (product.photo_urls && product.photo_urls.length)) && (
                                                    <div className="text-white/60 text-sm space-y-1">
                                                        {product.notes && <p>{product.notes}</p>}
                                                        {product.pros && <p className="text-green-300">+ {product.pros}</p>}
                                                        {product.cons && <p className="text-red-300">- {product.cons}</p>}
                                                        {getProductPhotoUrls(product).length > 0 && (
                                                            <div className="mt-2 grid gap-3 md:grid-cols-2">
                                                                {getProductPhotoUrls(product).map((url, index) => (
                                                                    <img
                                                                        key={`${url}-${index}`}
                                                                        src={url}
                                                                        alt={language === 'en' ? 'Product photo' : 'Фото продукта'}
                                                                        className="max-w-full rounded-lg border border-white/20"
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingProduct(product);
                                                        setIsCreatingProduct(false);
                                                        setProductName(product.name);
                                                        setProductAssessment(product.assessment);
                                                        setProductPros(product.pros || '');
                                                        setProductCons(product.cons || '');
                                                        setProductDescription(product.notes || '');
                                                        setProductPhotoUrl(product.photo_url || '');
                                                        setShowProducts(true);
                                                    }}
                                                    className="text-white/70 hover:text-white transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteProduct(product.id)}
                                                    className="text-red-400 hover:text-red-300 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Create/Edit Form */}
                {(isCreating || editingEntry) && (
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingEntry ? t('edit') : t('addEntry')}
                        </h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white/80 mb-2">{t('time')}</label>
                                    <input
                                        {...register('time', { required: true })}
                                        type="time"
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                                    />
                                    {errors.time && <p className="text-red-400 text-sm mt-1">Time is required</p>}
                                </div>
                                <div>
                                    <label className="block text-white/80 mb-2">{t('title')}</label>
                                    <input
                                        {...register('title', { required: true })}
                                        type="text"
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                        placeholder={language === 'en' ? 'Meal name...' : 'Название приема...'}
                                    />
                                    {errors.title && <p className="text-red-400 text-sm mt-1">Title is required</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white/80 mb-2">{t('calories')}</label>
                                    <input
                                        {...register('calories', { valueAsNumber: true })}
                                        type="number"
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/80 mb-2">{t('proteins')}</label>
                                    <input
                                        {...register('proteins', { valueAsNumber: true })}
                                        type="number"
                                        step="0.1"
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                        placeholder="0.0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white/80 mb-2">{t('fats')}</label>
                                    <input
                                        {...register('fats', { valueAsNumber: true })}
                                        type="number"
                                        step="0.1"
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                        placeholder="0.0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/80 mb-2">{t('carbs')}</label>
                                    <input
                                        {...register('carbs', { valueAsNumber: true })}
                                        type="number"
                                        step="0.1"
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                        placeholder="0.0"
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    {t('save')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreating(false);
                                        setEditingEntry(null);
                                        reset();
                                    }}
                                    className="bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    {t('cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-full mb-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                        <p className="text-white/60">{language === 'en' ? 'Loading...' : 'Загрузка...'}</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
                        <p className="text-red-200">{error}</p>
                        <button
                            onClick={() => refreshEntries()}
                            className="mt-2 text-red-200 hover:text-white underline"
                        >
                            {language === 'en' ? 'Try again' : 'Попробовать снова'}
                        </button>
                    </div>
                )}

                {/* Entries */}
                <div className="space-y-6">
                    {filteredEntries.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
                                <Utensils className="w-10 h-10 text-white/60" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">{t('noEntries')}</h3>
                            <p className="text-white/60 mb-6">{t('createFirst')}</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                            >
                                {t('addEntry')}
                            </button>
                        </div>
                    ) : (
                        filteredEntries.map((entry) => (
                            <div
                                key={entry.id}
                                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-4 mb-3">
                                            <div className="flex items-center text-white/60">
                                                <Clock className="w-4 h-4 mr-1" />
                                                <span>{entry.time}</span>
                                            </div>
                                            <h3 className="text-xl font-semibold text-white">{entry.title}</h3>
                                        </div>

                                        {(entry.calories || entry.proteins || entry.fats || entry.carbs) && (
                                            <div className="grid grid-cols-4 gap-4 mt-4">
                                                {entry.calories && (
                                                    <div className="text-center">
                                                        <div className="text-orange-400 text-sm">{t('calories')}</div>
                                                        <div className="text-white font-semibold">{entry.calories}</div>
                                                    </div>
                                                )}
                                                {entry.proteins && (
                                                    <div className="text-center">
                                                        <div className="text-blue-400 text-sm">{t('proteins')}</div>
                                                        <div className="text-white font-semibold">{entry.proteins}g</div>
                                                    </div>
                                                )}
                                                {entry.fats && (
                                                    <div className="text-center">
                                                        <div className="text-yellow-400 text-sm">{t('fats')}</div>
                                                        <div className="text-white font-semibold">{entry.fats}g</div>
                                                    </div>
                                                )}
                                                {entry.carbs && (
                                                    <div className="text-center">
                                                        <div className="text-green-400 text-sm">{t('carbs')}</div>
                                                        <div className="text-white font-semibold">{entry.carbs}g</div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex space-x-2 ml-4">
                                        <button
                                            onClick={() => handleEdit(entry)}
                                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(entry.id)}
                                            className="p-2 text-white/60 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Nutrition;
