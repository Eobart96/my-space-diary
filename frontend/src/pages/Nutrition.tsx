import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Utensils, Flame, ArrowLeft, TrendingUp, Clock, Search, Package, Tag, AlertCircle, CheckCircle } from 'lucide-react';
import { NutritionEntry, CreateNutritionRequest } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useNutrition } from '../hooks/useNutrition';

interface Product {
    id: number;
    name: string;
    assessment: 'positive' | 'negative' | 'neutral';
    notes: string;
    created_at: string;
}

const Nutrition: React.FC = () => {
    const { t, language } = useLanguage();
    const { addEntry, updateEntry, deleteEntry, getEntries, getDailySummary } = useNutrition();
    const [isCreating, setIsCreating] = useState(false);
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);
    const [editingEntry, setEditingEntry] = useState<NutritionEntry | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<Product[]>(() => {
        try {
            const saved = localStorage.getItem('nutrition-products');
            return saved ? (JSON.parse(saved) as Product[]) : [];
        } catch {
            return [];
        }
    });

    // Product form states
    const [productName, setProductName] = useState('');
    const [productAssessment, setProductAssessment] = useState<'positive' | 'negative' | 'neutral'>('neutral');
    const [productNotes, setProductNotes] = useState('');

    // Save products to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('nutrition-products', JSON.stringify(products));
        } catch (error) {
            console.error('Error saving products:', error);
        }
    }, [products]);

    const addProduct = (productData: Omit<Product, 'id' | 'created_at'>) => {
        const newProduct: Product = {
            ...productData,
            id: Date.now(),
            created_at: new Date().toISOString()
        };

        setProducts(prev => [...prev, newProduct]);
    };

    const deleteProduct = (id: number) => {
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    const filteredEntries = getEntries(selectedDate).filter(entry =>
        entry.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
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

    const onSubmit = (data: CreateNutritionRequest) => {
        const submitData = { ...data, date: selectedDate };
        if (editingEntry) {
            updateEntry(editingEntry.id, submitData);
        } else {
            addEntry(submitData);
        }
        reset();
        setIsCreating(false);
        setEditingEntry(null);
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

    const handleDelete = (id: number) => {
        if (window.confirm(language === 'en' ? 'Are you sure?' : 'Вы уверены?')) {
            deleteEntry(id);
        }
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
                        <button
                            onClick={() => setIsCreatingProduct(true)}
                            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {language === 'en' ? 'Add Product' : 'Добавить продукт'}
                        </button>
                    </div>

                    {/* Add Product Form */}
                    {isCreatingProduct && (
                        <div className="bg-white/5 rounded-lg p-4 mb-6 space-y-4">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                {language === 'en' ? 'Add New Product' : 'Добавить новый продукт'}
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

                            <div>
                                <label className="block text-white/80 mb-2">
                                    {language === 'en' ? 'Notes' : 'Записи'}
                                </label>
                                <textarea
                                    value={productNotes}
                                    onChange={(e) => setProductNotes(e.target.value)}
                                    rows={3}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                    placeholder={language === 'en' ? 'Add your notes about this product...' : 'Добавьте заметки об этом продукте...'}
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        if (productName.trim()) {
                                            addProduct({
                                                name: productName.trim(),
                                                assessment: productAssessment,
                                                notes: productNotes
                                            });

                                            setProductName('');
                                            setProductAssessment('neutral');
                                            setProductNotes('');
                                            setIsCreatingProduct(false);
                                        }
                                    }}
                                    className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                                >
                                    {language === 'en' ? 'Add Product' : 'Добавить продукт'}
                                </button>
                                <button
                                    onClick={() => {
                                        setProductName('');
                                        setProductAssessment('neutral');
                                        setProductNotes('');
                                        setIsCreatingProduct(false);
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
                                        {product.notes && (
                                            <p className="text-white/60 text-sm">{product.notes}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => deleteProduct(product.id)}
                                        className="text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
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
