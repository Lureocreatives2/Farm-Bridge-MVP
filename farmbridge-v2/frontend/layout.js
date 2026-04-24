/**
 * FarmBridge — Shared Layout Components
 * Injects nav and footer into every page automatically
 */

function initLayout(activePage) {
  const navPages = [
    { href: "index.html",           label: "Home",         key: "home"     },
    { href: "shop.html",            label: "Shop",         key: "shop"     },
    { href: "farmers.html",         label: "Our Farmers",  key: "farmers"  },
    { href: "about.html",           label: "About",        key: "about"    },
    { href: "contact.html",         label: "Contact",      key: "contact"  },
  ];

  const links = navPages.map((p) =>
    `<a href="${p.href}" class="${activePage === p.key ? "active" : ""}">${p.label}</a>`
  ).join("");

  const nav = `
    <nav class="nav">
      <div class="container nav__inner">
        <a href="index.html" class="nav__logo">🌾 Farm<span>Bridge</span></a>
        <div class="nav__links" id="navLinks">
          ${links}
          <a href="list-product.html" class="nav__cta">+ List Product</a>
        </div>
        <button class="nav__mobile-toggle" onclick="toggleNav()" aria-label="Toggle menu">☰</button>
      </div>
    </nav>`;

  const footer = `
    <footer>
      <div class="foot-brand">FarmBridge</div>
      <nav class="foot-links">
        <a href="index.html">Home</a>
        <a href="shop.html">Shop</a>
        <a href="farmers.html">Farmers</a>
        <a href="about.html">About Us</a>
        <a href="faq.html">FAQ</a>
        <a href="contact.html">Contact</a>
        <a href="register-farmer.html">Join as Farmer</a>
      </nav>
      <p>© 2024 FarmBridge · Connecting Nigerian farmers directly with buyers · No middlemen.</p>
    </footer>`;

  // Inject before first element in body
  const navEl = document.createElement("div");
  navEl.innerHTML = nav;
  document.body.insertBefore(navEl.firstElementChild, document.body.firstChild);

  // Inject footer at end
  const footEl = document.createElement("div");
  footEl.innerHTML = footer;
  document.body.appendChild(footEl.firstElementChild);
}

function toggleNav() {
  document.getElementById("navLinks")?.classList.toggle("open");
}
