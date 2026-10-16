
const SUPABASE_URL = "https://ksaemjkqkjqxyzfuufkd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_hMmc8X7K5vnmWne5DfUUhQ_GSYObkyC";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

let products = [];
let activeCategory = "Semua";
let toastTimer;

const grid = document.querySelector("#productGrid");
const searchInput = document.querySelector("#searchInput");
const sortSelect = document.querySelector("#sortSelect");
const resultCount = document.querySelector("#resultCount");
const emptyState = document.querySelector("#emptyState");
const submitDialog = document.querySelector("#submitDialog");
const previewDialog = document.querySelector("#previewDialog");
const toast = document.querySelector("#toast");

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function getCategoryStyle(category) {
  const styles = {
    "Game": ["🎮", "bg-purple"],
    "Website": ["🌐", "bg-green"],
    "Aplikasi": ["📱", "bg-blue"],
    "AI Tools": ["✧", "bg-yellow"],
    "Produk Digital": ["◈", "bg-peach"]
  };

  const style = styles[category] || ["◈", "bg-pink"];
  return { icon: style[0], color: style[1] };
}

async function loadProducts() {
  grid.innerHTML = "<p>Memuat proyek...</p>";
  grid.classList.remove("hidden");
  emptyState.classList.add("hidden");

  const { data, error } = await supabaseClient
    .from("submissions")
    .select("id, name, category, description, url, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal memuat proyek:", error);
    grid.innerHTML = "";
    grid.classList.add("hidden");
    emptyState.classList.remove("hidden");
    emptyState.querySelector("h3").textContent =
      "Proyek belum dapat dimuat";
    emptyState.querySelector("p").textContent =
      "Periksa koneksi internet dan konfigurasi Supabase.";
    resultCount.textContent = "Gagal memuat";
    showToast("Gagal memuat proyek dari database.");
    return;
  }

  products = (data || []).map(item => {
    const style = getCategoryStyle(item.category);

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      maker: "Kreator",
      url: item.url,
      icon: style.icon,
      color: style.color,
      featured: false
    };
  });

  renderProducts();
}

function renderProducts() {
  const term = searchInput.value.trim().toLowerCase();

  let filtered = products.filter(product => {
    const categoryMatch =
      activeCategory === "Semua" ||
      product.category === activeCategory;

    const searchMatch = [
      product.name,
      product.category,
      product.description,
      product.maker
    ].some(value => value.toLowerCase().includes(term));

    return categoryMatch && searchMatch;
  });

  if (sortSelect.value === "az") {
    filtered.sort((a, b) =>
      a.name.localeCompare(b.name, "id")
    );
  }

  resultCount.textContent = `${filtered.length} proyek`;

  grid.innerHTML = filtered.map(product => `
    <article class="product-card">
      <div class="card-top">
        <div class="product-icon ${product.color}">
          ${product.icon}
        </div>
        <span class="tag">${escapeHTML(product.category)}</span>
      </div>
      <h3>${escapeHTML(product.name)}</h3>
      <p>${escapeHTML(product.description)}</p>
      <div class="card-footer">
        <span class="maker">◉ ${escapeHTML(product.maker)}</span>
        <button class="view-btn" data-preview="${escapeHTML(product.id)}">
          Lihat proyek ↗
        </button>
      </div>
    </article>
  `).join("");

  emptyState.classList.toggle("hidden", filtered.length !== 0);
  grid.classList.toggle("hidden", filtered.length === 0);

  if (filtered.length === 0) {
    emptyState.querySelector("h3").textContent =
      "Belum ada proyek yang cocok";
    emptyState.querySelector("p").textContent =
      "Proyek yang sudah disetujui akan muncul di sini.";
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function openSubmit() {
  if (typeof submitDialog.showModal === "function") {
    submitDialog.showModal();
  } else {
    showToast("Browser belum mendukung formulir ini.");
  }
}

function openPreview(id) {
  const product = products.find(item => String(item.id) === String(id));
  if (!product) return;

  document.querySelector("#previewContent").innerHTML = `
    <div class="preview-visual ${product.color}">${product.icon}</div>
    <div class="preview-meta">
      <span class="tag">${escapeHTML(product.category)}</span>
    </div>
    <h2>${escapeHTML(product.name)}</h2>
    <p>${escapeHTML(product.description)}</p>
    <p><strong>Kreator:</strong> ${escapeHTML(product.maker)}</p>
    <a class="btn btn-primary"
       href="${escapeHTML(product.url)}"
       target="_blank"
       rel="noopener noreferrer">
      Kunjungi proyek ↗
    </a>
  `;

  previewDialog.showModal();
}

document.querySelectorAll("[data-category]").forEach(button => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;

    document.querySelectorAll("[data-category]").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    renderProducts();
  });
});

searchInput.addEventListener("input", renderProducts);
sortSelect.addEventListener("change", renderProducts);

grid.addEventListener("click", event => {
  const button = event.target.closest("[data-preview]");
  if (button) openPreview(button.dataset.preview);
});

document.querySelector("#resetSearch").addEventListener("click", () => {
  searchInput.value = "";
  activeCategory = "Semua";
  sortSelect.value = "featured";

  document.querySelectorAll("[data-category]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.category === "Semua"
    );
  });

  renderProducts();
});

["submitTop", "submitHero", "submitBottom", "submitBanner"]
  .forEach(id => {
    document.querySelector("#" + id)
      .addEventListener("click", openSubmit);
  });

document.querySelector("#closeDialog").addEventListener("click", () => {
  submitDialog.close();
});

document.querySelector("#closePreview").addEventListener("click", () => {
  previewDialog.close();
});

document.querySelector("#menuToggle").addEventListener("click", () => {
  document.querySelector(".site-header")
    .classList.toggle("mobile-open");
});

document.querySelectorAll(".desktop-nav a").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelector(".site-header")
      .classList.remove("mobile-open");
  });
});

document.querySelector("#submitForm").addEventListener("submit", async event => {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const data = new FormData(form);

  const name = String(data.get("name") || "").trim();
  const category = String(data.get("category") || "").trim();
  const description = String(data.get("description") || "").trim();
  const rawUrl = String(data.get("url") || "").trim();
  const contact = String(data.get("contact") || "").trim();
  const errorBox = document.querySelector("#formError");

  errorBox.classList.add("hidden");

  let parsedUrl;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    parsedUrl = null;
  }

  if (!parsedUrl || parsedUrl.protocol !== "https:") {
    errorBox.textContent =
      "Masukkan tautan HTTPS yang valid, misalnya https://contoh.com.";
    errorBox.classList.remove("hidden");
    return;
  }

  if (!name || !category || !description) {
    errorBox.textContent = "Lengkapi semua kolom yang wajib diisi.";
    errorBox.classList.remove("hidden");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Mengirim...";

  try {
    const { error } = await supabaseClient
      .from("submissions")
      .insert([{
        name,
        category,
        description,
        url: parsedUrl.href,
        contact: contact || null
      }]);

    if (error) throw error;

    submitDialog.close();

    document.querySelector("#previewContent").innerHTML = `
      <div class="preview-visual bg-green">✓</div>
      <h2>Pengajuan berhasil dikirim!</h2>
      <p>Proyekmu sudah masuk ke database PromoHub dan menunggu pemeriksaan admin.</p>
      <p>Proyek belum tampil untuk publik sampai disetujui.</p>
      <button class="btn btn-primary" id="doneSubmission">Selesai</button>
    `;

    previewDialog.showModal();

    document.querySelector("#doneSubmission")
      .addEventListener("click", () => previewDialog.close());

    form.reset();
    showToast("Pengajuan berhasil dikirim.");

  } catch (error) {
    console.error("Pengajuan gagal:", error);

    errorBox.textContent =
      "Pengajuan gagal dikirim. Periksa koneksi, konfigurasi Supabase, dan kebijakan database, lalu coba lagi.";
    errorBox.classList.remove("hidden");

  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Siapkan pengajuan ↗";
  }
});

document.querySelector("#year").textContent =
  new Date().getFullYear();

loadProducts();
