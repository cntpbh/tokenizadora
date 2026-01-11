'use client';

import { useState, useEffect } from 'react';
import { 
  Edit, Loader2, Search, Save, X, Hash, MapPin, Building2,
  DollarSign, Package, FileText, ExternalLink, Check, Image
} from 'lucide-react';
import { getProjects, updateProject, Project } from '@/lib/supabase';

export default function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    price_brl: 0,
    min_purchase: 1,
    min_purchase_reason: '',
    image_url: '',
    video_url: '',
    document_url: '',
    institution_name: '',
    institution_description: '',
    institution_url: '',
    status: 'active',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
    setLoading(false);
  };

  const handleEdit = (project: Project) => {
    setForm({
      name: project.name || '',
      description: project.description || '',
      location: project.location || '',
      price_brl: project.price_brl || 0,
      min_purchase: project.min_purchase || 1,
      min_purchase_reason: project.min_purchase_reason || '',
      image_url: project.image_url || '',
      video_url: project.video_url || '',
      document_url: project.document_url || '',
      institution_name: project.institution_name || '',
      institution_description: project.institution_description || '',
      institution_url: project.institution_url || '',
      status: project.status || 'active',
    });
    setEditingProject(project);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!editingProject?.id) return;
    
    setSaving(true);
    try {
      await updateProject(editingProject.id, form);
      await loadProjects();
      setSaved(true);
      setTimeout(() => {
        setEditingProject(null);
        setSaved(false);
      }, 1500);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar projeto');
    }
    setSaving(false);
  };

  const filteredProjects = search
    ? projects.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      )
    : projects;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Editar Projetos</h3>
          <p className="text-sm text-gray-500">
            Altere preço, quantidade mínima e outras configurações dos tokens
          </p>
        </div>
      </div>

      {/* Modal de Edição */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-emerald-50">
              <div>
                <h3 className="font-bold text-lg text-gray-800">Editar Projeto</h3>
                <p className="text-sm text-gray-500">Token #{editingProject.token_id} - {editingProject.name}</p>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="p-2 hover:bg-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
              {/* Nome e Descrição */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Preço e Mínimo */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="font-bold text-amber-800 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Valores e Quantidade Mínima
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço por Token (R$)
                    </label>
                    <input
                      type="number"
                      value={form.price_brl}
                      onChange={(e) => setForm({ ...form, price_brl: parseFloat(e.target.value) || 0 })}
                      min={0.01}
                      step={0.01}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantidade Mínima
                    </label>
                    <input
                      type="number"
                      value={form.min_purchase}
                      onChange={(e) => setForm({ ...form, min_purchase: parseInt(e.target.value) || 1 })}
                      min={1}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Justificativa do Mínimo
                  </label>
                  <input
                    type="text"
                    value={form.min_purchase_reason}
                    onChange={(e) => setForm({ ...form, min_purchase_reason: e.target.value })}
                    placeholder="Ex: Cada token = 1 hora de consultoria. Mínimo de 4h para execução do projeto."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esta mensagem será exibida para o comprador no momento da compra
                  </p>
                </div>

                {form.min_purchase > 1 && (
                  <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                    <p className="text-sm text-amber-800">
                      📦 Pacote Mínimo: <strong>{form.min_purchase} tokens = R$ {(form.min_purchase * form.price_brl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* URLs */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-800 flex items-center">
                  <Image className="w-5 h-5 mr-2 text-emerald-600" />
                  Mídia e Links
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL do Vídeo</label>
                  <input
                    type="url"
                    value={form.video_url}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL do Documento</label>
                  <input
                    type="url"
                    value={form.document_url}
                    onChange={(e) => setForm({ ...form, document_url: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="active">✅ Ativo</option>
                  <option value="paused">⏸️ Pausado</option>
                  <option value="sold_out">🚫 Esgotado</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => setEditingProject(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-2 rounded-lg font-medium flex items-center ${
                  saved 
                    ? 'bg-green-600 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : saved ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Salvo!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar projetos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Lista de Projetos */}
      <div className="space-y-3">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum projeto encontrado</p>
          </div>
        ) : (
          filteredProjects.map(project => (
            <div 
              key={project.id}
              className="border rounded-xl p-4 hover:border-emerald-300 transition bg-white"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {project.image_url && (
                    <img 
                      src={project.image_url} 
                      alt={project.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-800">{project.name}</h4>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        Token #{project.token_id}
                      </span>
                      {project.status === 'active' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Ativo
                        </span>
                      )}
                      {project.status === 'paused' && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                          Pausado
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        R$ {project.price_brl?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="flex items-center">
                        <Package className="w-4 h-4 mr-1" />
                        Mín: {project.min_purchase || 1}
                      </span>
                      {project.location && (
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {project.location}
                        </span>
                      )}
                    </div>

                    {project.min_purchase_reason && (
                      <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-2 py-1 rounded">
                        📦 {project.min_purchase_reason}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleEdit(project)}
                  className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
