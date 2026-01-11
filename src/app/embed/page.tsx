'use client';

import { useState } from 'react';
import { Copy, CheckCircle, Code, Monitor, Smartphone, ExternalLink } from 'lucide-react';

export default function EmbedPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');

  const sizes = {
    small: { width: 320, height: 400 },
    medium: { width: 400, height: 450 },
    large: { width: 500, height: 500 },
  };

  const currentSize = sizes[size];
  const widgetUrl = 'https://ibedis-token-platform.vercel.app/widget';

  const iframeCode = `<iframe 
  src="${widgetUrl}" 
  width="${currentSize.width}" 
  height="${currentSize.height}" 
  frameborder="0" 
  scrolling="no"
  style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"
></iframe>`;

  const responsiveCode = `<div style="position: relative; width: 100%; max-width: 500px; margin: 0 auto;">
  <iframe 
    src="${widgetUrl}" 
    width="100%" 
    height="450" 
    frameborder="0" 
    scrolling="no"
    style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"
  ></iframe>
</div>`;

  const scriptCode = `<div id="ibedis-widget"></div>
<script>
(function() {
  var container = document.getElementById('ibedis-widget');
  var iframe = document.createElement('iframe');
  iframe.src = '${widgetUrl}';
  iframe.width = '100%';
  iframe.height = '450';
  iframe.frameBorder = '0';
  iframe.scrolling = 'no';
  iframe.style.borderRadius = '12px';
  iframe.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
  iframe.style.maxWidth = '500px';
  container.appendChild(iframe);
})();
</script>`;

  const wordpressCode = `[iframe src="${widgetUrl}" width="100%" height="450"]

<!-- Ou use o plugin "Insert Headers and Footers" com: -->
<iframe src="${widgetUrl}" width="400" height="450" frameborder="0" scrolling="no" style="border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);"></iframe>`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎠 Widget Carrossel IBEDIS Token
          </h1>
          <p className="text-gray-600 text-lg">
            Incorpore o marketplace de tokens sustentáveis no seu site
          </p>
        </div>

        {/* Preview e Tamanhos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Preview */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
              <Monitor className="w-5 h-5 mr-2 text-emerald-600" />
              Preview
            </h2>
            
            {/* Seletor de tamanho */}
            <div className="flex gap-2 mb-4">
              {(['small', 'medium', 'large'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    size === s 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s === 'small' && <Smartphone className="w-4 h-4 inline mr-1" />}
                  {s === 'medium' && <Monitor className="w-4 h-4 inline mr-1" />}
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Tamanho: {currentSize.width}x{currentSize.height}px
            </p>

            {/* Iframe Preview */}
            <div className="flex justify-center bg-gray-100 rounded-xl p-4 overflow-auto">
              <iframe
                src="/widget"
                width={currentSize.width}
                height={currentSize.height}
                frameBorder="0"
                scrolling="no"
                style={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
            </div>
          </div>

          {/* Link direto */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
              <ExternalLink className="w-5 h-5 mr-2 text-emerald-600" />
              Link Direto
            </h2>
            
            <p className="text-gray-600 mb-4">
              Acesse o widget diretamente ou compartilhe este link:
            </p>

            <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-between mb-4">
              <code className="text-sm text-emerald-700 truncate">{widgetUrl}</code>
              <button
                onClick={() => copyToClipboard(widgetUrl, 'url')}
                className="ml-2 p-2 hover:bg-gray-200 rounded-lg transition"
              >
                {copied === 'url' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>

            <a
              href="/widget"
              target="_blank"
              className="block text-center py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition"
            >
              Abrir Widget em Nova Aba
            </a>

            <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <h4 className="font-bold text-emerald-800 mb-2">✨ Recursos do Widget</h4>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>✅ Carrossel automático (5s)</li>
                <li>✅ Navegação manual</li>
                <li>✅ Link direto para compra</li>
                <li>✅ Design responsivo</li>
                <li>✅ Atualização em tempo real</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Códigos de Embed */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">📋 Códigos de Incorporação</h2>

          {/* Iframe Simples */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center">
                <Code className="w-5 h-5 mr-2 text-blue-600" />
                1. Iframe Simples
              </h3>
              <button
                onClick={() => copyToClipboard(iframeCode, 'iframe')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center"
              >
                {copied === 'iframe' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </>
                )}
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto text-sm">
              <code>{iframeCode}</code>
            </pre>
          </div>

          {/* Responsivo */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center">
                <Smartphone className="w-5 h-5 mr-2 text-purple-600" />
                2. Responsivo (Recomendado)
              </h3>
              <button
                onClick={() => copyToClipboard(responsiveCode, 'responsive')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center"
              >
                {copied === 'responsive' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </>
                )}
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto text-sm">
              <code>{responsiveCode}</code>
            </pre>
          </div>

          {/* JavaScript */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center">
                <Code className="w-5 h-5 mr-2 text-yellow-600" />
                3. JavaScript Dinâmico
              </h3>
              <button
                onClick={() => copyToClipboard(scriptCode, 'script')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center"
              >
                {copied === 'script' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </>
                )}
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto text-sm">
              <code>{scriptCode}</code>
            </pre>
          </div>

          {/* WordPress */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center">
                <span className="mr-2">📝</span>
                4. WordPress
              </h3>
              <button
                onClick={() => copyToClipboard(wordpressCode, 'wordpress')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center"
              >
                {copied === 'wordpress' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </>
                )}
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto text-sm">
              <code>{wordpressCode}</code>
            </pre>
          </div>
        </div>

        {/* Dicas */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="font-bold text-amber-800 mb-3">💡 Dicas de Uso</h3>
          <ul className="text-amber-700 space-y-2">
            <li>• Use o código <strong>Responsivo</strong> para sites mobile-friendly</li>
            <li>• O widget atualiza automaticamente quando novos tokens são criados</li>
            <li>• Personalize o tamanho alterando width e height no código</li>
            <li>• O carrossel passa automaticamente a cada 5 segundos</li>
            <li>• Clique em "Comprar" redireciona para a plataforma completa</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>🌱 IBEDIS Token - Ativos Sustentáveis na Blockchain</p>
        </div>
      </div>
    </div>
  );
}
