// Perfil local do usuário (nome de exibição + foto), por conta, no localStorage.
// Observação: é uma preferência local do dispositivo — não altera a conta no servidor.

const chave = (user) => `gwi_perfil_${user?.id ?? user?.email ?? "anon"}`;

export function lerPerfil(user) {
  try { return JSON.parse(localStorage.getItem(chave(user))) || {}; }
  catch { return {}; }
}

export function salvarPerfil(user, dados) {
  try {
    const atual = lerPerfil(user);
    const novo = { ...atual, ...dados };
    localStorage.setItem(chave(user), JSON.stringify(novo));
    return novo;
  } catch { return lerPerfil(user); }
}

// Combina os dados do servidor com as preferências locais.
export function usuarioExibicao(user, perfil) {
  if (!user) return user;
  return {
    ...user,
    nome: (perfil?.nome && perfil.nome.trim()) || user.nome,
    foto: perfil?.foto || user.foto || null,
  };
}

// Redimensiona/comprime a imagem escolhida para um data URL pequeno (máx ~256px).
export function processarFoto(file, max = 256) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Selecione um arquivo de imagem."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler a imagem."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagem inválida."));
      img.onload = () => {
        const escala = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * escala);
        const h = Math.round(img.height * escala);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
