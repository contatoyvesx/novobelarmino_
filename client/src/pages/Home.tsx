import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [aboutCarouselIndex, setAboutCarouselIndex] = useState(0);
  const [barbeariaScrollProgress, setBarbeariaScrollProgress] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  const barbeariaImageRef = useRef<HTMLDivElement>(null);

  const services = [
    { title: "Corte Clássico", description: "Corte tradicional com acabamento perfeito", price: "R$ 45,00", icon: "✂️" },
    { title: "Barba & Bigode", description: "Modelagem e design de barba", price: "R$ 35,00", icon: "🧔" },
    { title: "Corte + Barba", description: "Combo completo de grooming", price: "R$ 70,00", icon: "💈" },
    { title: "Pigmentação", description: "Coloração de barba e cabelo", price: "R$ 55,00", icon: "🎨" },
  ];

  const portfolio = [
    { title: "Corte Fade", image: "/galeria1.png" },
    { title: "Barba Desenhada", image: "/galeria2.png" },
    { title: "Corte Moderno", image: "/galeria3.png" },
    { title: "Estilo Retrô", image: "/galeria4.png" },
  ];

  const aboutImages = ["/sobre1.jpg", "/sobre2.jpg", "/sobre3.jpg"];

  const heroParticles = useMemo(
    () =>
      Array.from({ length: 24 }).map(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 6 + Math.random() * 12,
        blur: 2 + Math.random() * 6,
        opacity: 0.15 + Math.random() * 0.25,
        duration: 5 + Math.random() * 4,
        delay: Math.random() * 3,
      })),
    []
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      if (!barbeariaImageRef.current) return;

      const rect = barbeariaImageRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.top <= 0 && rect.bottom >= windowHeight) {
        const centerOffset = Math.abs(windowHeight / 2 - (rect.top + rect.height / 2));
        setBarbeariaScrollProgress(Math.max(0, 1 - centerOffset / (windowHeight / 2)));
      } else if (rect.top >= 0 && rect.bottom <= windowHeight) {
        setBarbeariaScrollProgress(1);
      } else {
        setBarbeariaScrollProgress(0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % portfolio.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [portfolio.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAboutCarouselIndex((prev) => (prev + 1) % aboutImages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [aboutImages.length]);

  const handleAgendarClick = () => {
    setMobileMenuOpen(false);
    window.location.href = "/agendar";
  };

  const handleContatoClick = () => {
    setMobileMenuOpen(false);
    window.open("https://wa.me/5511952861321", "_blank");
  };

  const handleInstagramClick = () => {
    setMobileMenuOpen(false);
    window.open("https://instagram.com/belarmino_barbershop", "_blank");
  };

  const handleLogout = async () => {
    await signOut(auth);
    setMobileMenuOpen(false);
  };

  const navBackground =
    scrollY > 50 ? "rgba(42, 9, 6, 0.65)" : "rgba(42, 9, 6, 0.95)";

  return (
    <div className="min-h-screen bg-[#140000] text-white overflow-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D9A66A] rounded-full opacity-5 blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#6e2317] rounded-full opacity-5 blur-3xl animate-float" />
      </div>

      <nav
        className="fixed top-0 w-full border-b-2 border-[#D9A66A] z-50 shadow-lg backdrop-blur-md transition-colors duration-300"
        style={{ backgroundColor: navBackground }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/ícone-fundotransparente.png" alt="Belarmino" className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-[#D9A66A]" style={{ fontFamily: "'Playfair Display', serif" }}>
              BELARMINO
            </h1>
          </div>

          <ul className="hidden md:flex gap-6 text-sm font-semibold uppercase tracking-wider items-center">
            <li><a href="#servicos" className="text-[#E8C8A3] hover:text-[#D9A66A] transition">Serviços</a></li>
            <li><a href="#portfolio" className="text-[#E8C8A3] hover:text-[#D9A66A] transition">Portfolio</a></li>
            <li><a href="#contato" className="text-[#E8C8A3] hover:text-[#D9A66A] transition">Contato</a></li>
            <li><Link href="/agendar" className="text-[#E8C8A3] hover:text-[#D9A66A] transition">Agendar</Link></li>

            {!user ? (
              <li className="px-3 py-1 rounded-full border border-[#D9A66A]/30 text-xs text-neutral-300 normal-case">
                Não logado
              </li>
            ) : (
              <li className="flex items-center gap-3 normal-case">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#140000]/70 border border-[#D9A66A]/30">
                  {user.photoURL && <img src={user.photoURL} alt="Usuário" className="w-6 h-6 rounded-full" />}
                  <span className="text-xs text-[#E8C8A3] max-w-28 truncate">
                    {user.displayName || user.email}
                  </span>
                </div>

                <button onClick={handleLogout} className="text-xs text-red-300 hover:text-red-400 transition">
                  Sair
                </button>
              </li>
            )}
          </ul>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#D9A66A] text-2xl"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#2a0906] border-t border-[#D9A66A]">
            <div className="px-4 py-4 space-y-3">
              <a href="#servicos" onClick={() => setMobileMenuOpen(false)} className="block text-[#E8C8A3] py-2 font-semibold uppercase">Serviços</a>
              <a href="#portfolio" onClick={() => setMobileMenuOpen(false)} className="block text-[#E8C8A3] py-2 font-semibold uppercase">Portfolio</a>
              <a href="#contato" onClick={() => setMobileMenuOpen(false)} className="block text-[#E8C8A3] py-2 font-semibold uppercase">Contato</a>
              <Link href="/agendar" onClick={() => setMobileMenuOpen(false)} className="block text-[#E8C8A3] py-2 font-semibold uppercase">Agendar</Link>

              <div className="pt-3 border-t border-[#D9A66A]/20">
                {!user ? (
                  <div className="text-sm text-neutral-400">Não logado</div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {user.photoURL && <img src={user.photoURL} alt="Usuário" className="w-8 h-8 rounded-full" />}
                      <div className="min-w-0">
                        <p className="text-sm text-[#E8C8A3] truncate">{user.displayName || "Usuário logado"}</p>
                        <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    <button onClick={handleLogout} className="text-sm text-red-300 hover:text-red-400">
                      Sair
                    </button>
                  </div>
                )}
              </div>

              <button onClick={handleAgendarClick} className="w-full btn-retro mt-4">
                Agendar
              </button>
            </div>
          </div>
        )}
      </nav>

      <section className="relative pt-32 pb-20 px-4 min-h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-[#060200] to-[#160400] opacity-95" />

          {heroParticles.map((particle, index) => (
            <span
              key={index}
              className="absolute rounded-full bg-[#d9a66a] mix-blend-screen"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                opacity: particle.opacity,
                filter: `blur(${particle.blur}px)`,
                animation: `float ${particle.duration}s ease-in-out infinite`,
                animationDelay: `${particle.delay}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <img
            src="/belarmino-logo.png"
            alt="Belarmino Barbershop"
            className="mx-auto w-56 md:w-[26rem] drop-shadow-[0_0_25px_rgba(217,166,106,0.4)] mb-8"
          />

          <p className="text-xl md:text-2xl text-[#E8C8A3] mb-8">
            Estilo Retrô, Qualidade Premium
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleAgendarClick} className="btn-retro">
              Agendar Agora
            </button>

            <button onClick={handleContatoClick} className="btn-retro-outline">
              Entre em Contato
            </button>
          </div>
        </div>
      </section>

      <section id="servicos" className="py-20 px-4 bg-[#2a0906] relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-[#D9A66A]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Nossos Serviços
          </h2>

          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#D9A66A] to-transparent mx-auto mb-16" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <div key={service.title} className="card-retro cursor-pointer hover:scale-105 transition" onClick={handleAgendarClick}>
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold text-[#D9A66A] mb-3">{service.title}</h3>
                <p className="text-gray-300 text-sm mb-4">{service.description}</p>
                <div className="pt-4 border-t border-[#6e2317]">
                  <p className="text-2xl font-bold text-[#E8C8A3]">{service.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#140000] relative z-10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="relative overflow-hidden rounded-lg border-4 border-[#D9A66A] shadow-lg">
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              {aboutImages.map((image, index) => (
                <img
                  key={image}
                  src={image}
                  alt={`Belarmino ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                    index === aboutCarouselIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setAboutCarouselIndex((prev) => (prev - 1 + aboutImages.length) % aboutImages.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-10 h-10"
            >
              ‹
            </button>

            <button
              onClick={() => setAboutCarouselIndex((prev) => (prev + 1) % aboutImages.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-10 h-10"
            >
              ›
            </button>
          </div>

          <div>
            <h2 className="text-4xl font-bold mb-6 text-[#D9A66A]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Sobre Belarmino
            </h2>

            <p className="text-gray-300 mb-4 leading-relaxed">
              Há mais de 35 anos, a Barbearia Belarmino é referência em estilo e qualidade na região.
            </p>

            <p className="text-gray-300 mb-6 leading-relaxed">
              Atendimento personalizado, produtos premium e um padrão profissional para cada cliente.
            </p>

            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#D9A66A]">35+</p>
                <p className="text-sm text-gray-400">Anos</p>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-[#D9A66A]">1000+</p>
                <p className="text-sm text-gray-400">Clientes</p>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-[#D9A66A]">5⭐</p>
                <p className="text-sm text-gray-400">Avaliação</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="portfolio" className="py-20 px-4 bg-[#2a0906] relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-[#D9A66A]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Galeria de Trabalhos
          </h2>

          <div className="relative max-w-2xl mx-auto mt-12">
            <div className="relative overflow-hidden rounded-lg border-4 border-[#D9A66A] shadow-lg">
              <div className="aspect-square overflow-hidden relative">
                {portfolio.map((item, index) => (
                  <div key={item.title} className={`absolute inset-0 transition-opacity duration-500 ${index === carouselIndex ? "opacity-100" : "opacity-0"}`}>
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              <button onClick={() => setCarouselIndex((prev) => (prev - 1 + portfolio.length) % portfolio.length)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#D9A66A] text-black rounded-full w-10 h-10">
                ‹
              </button>

              <button onClick={() => setCarouselIndex((prev) => (prev + 1) % portfolio.length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#D9A66A] text-black rounded-full w-10 h-10">
                ›
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#140000] relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-[#D9A66A]">
            Nossa Barbearia
          </h2>

          <div ref={barbeariaImageRef} className="overflow-hidden rounded-lg border-4 border-[#D9A66A] shadow-lg mt-12">
            <img
              src="/barbearia.png"
              alt="Barbearia Belarmino"
              className="w-full h-auto object-cover"
              style={{
                filter: `saturate(${barbeariaScrollProgress * 100}%)`,
                transition: "filter 1s ease-out",
              }}
            />
          </div>
        </div>
      </section>

      <section id="contato" className="py-20 px-4 bg-[#2a0906] relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 text-[#D9A66A]">
            Entre em Contato
          </h2>

          <p className="text-gray-300 mb-8">
            Agende online ou fale direto com a barbearia.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/agendar" className="btn-retro">
              Agendar online
            </Link>

            <button onClick={handleContatoClick} className="btn-retro-outline">
              Falar no WhatsApp
            </button>

            <button onClick={handleInstagramClick} className="btn-retro-outline">
              Instagram
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-[#140000] border-t border-[#D9A66A] py-6 text-center text-sm text-gray-400">
        © 2026 Barbearia Belarmino
      </footer>
    </div>
  );
}
