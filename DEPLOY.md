# Deploy para aplicativos.tiagonogueira.com.br - Hostinger

## 📋 Pré-requisitos
- Node.js instalado (versão 18 ou superior)
- Acesso ao painel do Hostinger
- Projeto baixado do GitHub

## 🚀 Processo de Deploy

### 1. Preparar o Build Local
```bash
# Instalar dependências
npm install

# Gerar build otimizado para Hostinger
npm run build:hostinger
```

### 2. Arquivos Gerados
O comando acima criará a pasta `dist/` com os seguintes arquivos otimizados:
- `index.html` (arquivo principal)
- `css/` (CSS minificado e otimizado)
- `js/` (JavaScript em chunks otimizados)
- `img/` (imagens otimizadas)
- `.htaccess` (configuração para SPA no Hostinger)

### 3. Upload para Hostinger

#### Via File Manager (Recomendado):
1. Acesse o painel do Hostinger
2. Vá em **Arquivos** → **Gerenciador de Arquivos**
3. Navegue até a pasta do subdomínio: `aplicativos.tiagonogueira.com.br/`
4. **Limpe a pasta** (remova arquivos antigos se existirem)
5. **Upload todos os arquivos** da pasta `dist/` para a raiz do subdomínio
6. Certifique-se que o arquivo `.htaccess` foi enviado

#### Via FTP (Alternativo):
```
Host: ftp.tiagonogueira.com.br
Usuário: [seu usuário FTP]
Senha: [sua senha FTP]
Pasta destino: /aplicativos.tiagonogueira.com.br/
```

### 4. Configuração do Subdomínio
1. No painel Hostinger, vá em **Subdomínios**
2. Certifique-se que `aplicativos.tiagonogueira.com.br` está apontando para a pasta correta
3. Se não existir, crie o subdomínio apontando para `/aplicativos.tiagonogueira.com.br/`

### 5. Verificação do Deploy
Acesse: `https://aplicativos.tiagonogueira.com.br`

**Testes importantes:**
- ✅ Página carrega corretamente
- ✅ Calculadora de salário funciona
- ✅ Navegação entre páginas (se houver) funciona
- ✅ Design responsivo em mobile
- ✅ Não há erros no console do navegador

## 🔧 Otimizações Implementadas

### Redução de Inodes
- **CSS único**: Todo CSS bundlado em um arquivo
- **JS otimizado**: Chunks mínimos e inteligentes
- **Assets inline**: Recursos pequenos embutidos no código
- **Total de arquivos**: ~10-15 arquivos (ao invés de 100+)

### Performance
- **Gzip ativado** via .htaccess
- **Cache browser** configurado para 1 ano em assets estáticos
- **Minificação** máxima de CSS/JS
- **Source maps desabilitados** em produção

### SEO e Usabilidade
- **Meta tags** otimizadas no index.html
- **SPA routing** configurado via .htaccess
- **Segurança** com headers de proteção
- **Fallback 404** para rotas do React Router

## 🐛 Solução de Problemas

### Página em branco após deploy:
1. Verifique se o arquivo `.htaccess` foi enviado
2. Confirme que todos os arquivos da pasta `dist/` foram enviados
3. Verifique o console do navegador por erros

### Erro 404 em rotas internas:
1. Confirme que o arquivo `.htaccess` está na raiz
2. Verifique se mod_rewrite está habilitado no Hostinger

### Build muito grande:
1. Execute `npm run analyze` para verificar o tamanho dos chunks
2. O build já está otimizado para usar mínimo de inodes

## 📞 Suporte
- **Autor**: Tiago Nogueira - Consultoria em Dpto. Pessoal
- **Email**: [seu email]
- **Site**: tiagonogueira.com.br

## 🔄 Atualizações Futuras
Para futuras atualizações:
1. Faça as alterações no código
2. Execute `npm run build:hostinger`
3. Substitua os arquivos na pasta do Hostinger
4. Não é necessário reconfigurar o subdomínio