// Função isolada para buscar livros na Open Library API
async function buscarLivroNaAPI(termo) {
    const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(termo)}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro na requisição da API.');
        
        const data = await response.json();
        
        // Se não encontrar nenhum documento
        if (!data.docs || data.docs.length === 0) {
            return null;
        }
        
        // Pegamos o primeiro resultado mais relevante
        const livro = data.docs[0];
        
        // Constrói a URL da capa baseada no ID fornecido pela API
        // Se não houver capa, usamos uma imagem placeholder padrão
        const capaId = livro.cover_i;
        const urlCapa = capaId 
            ? `https://covers.openlibrary.org/b/id/${capaId}-M.jpg` 
            : 'https://via.placeholder.com/128x192?text=Sem+Capa';

        return {
            titulo: livro.title,
            autor: livro.author_name ? livro.author_name[0] : 'Autor Desconhecido',
            capa: urlCapa
        };
        
    } catch (erro) {
        console.error("Erro ao buscar livro:", erro);
        throw erro;
    }
}