import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [activeService, setActiveService] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showParticles, setShowParticles] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [aboutCarouselIndex, setAboutCarouselIndex] = useState(0);
  const [barbeariaScrollProgress, setBarbeariaScrollProgress] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  const barbeariaImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      if (barbeariaImageRef.current) {
        const rect = barbeariaImageRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        const elementTop = rect.top;
        const elementBottom = rect.bottom;

        if (elementTop <= 0 && elementBottom >= windowHeight) {
          const centerOffset = Math.abs(
            windowHeight / 2 - (elementTop + (elementBottom - elementTop) / 2)
          );
          const maxOffset = windowHeight / 2;
          const progress = Math.max(0, 1 - centerOffset / maxOffset);
          setBarbeariaScrollProgress(progress);
        } else if (elementTop >= 0 && elementBottom <= windowHeight) {
          setBarbeariaScrollProgress(1);
        } else {
          setBarbeariaScrollProgress(0);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const services = [
    {
      title: "Corte Clássico",
      description: "Corte tradicional com acabamento perfeito",
      price: "R$ 45,00",
      icon: "✂️",
    },
    {
      title: "Barba & Bigode",
      description: "Modelagem e design de barba",
      price: "R$ 35,00",
      icon: "🧔",
    },
    {
      title: "Corte + Barba",
      description: "Combo completo de grooming",
      price: "R$ 70,00",
      icon: "💈",
    },
    {
      title: "Pigmentação",
      description: "Coloração de barba e cabelo",
      price: "R$ 55,00",
      icon: "🎨",
    },
  ];

  const portfolio = [
    { title: "Corte Fade", image: "/galeria1.png" },
    { title: "Barba Desenhada", image: "/galeria2.png" },
    { title: "Corte Moderno", image: "/galeria3.png" },
    { title: "Estilo Retrô", image: "/galeria4.png" },
  ];

  const aboutImages = ["/sobre1.jpg", "/sobre2.jpg", "/sobre3.jpg"];

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

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setMobileMenuOpen(false);
  };

  const nextSlide = () => {
    setCarouselIndex((prev) => (prev + 1) % portfolio.length);
  };

  const prevSlide = () => {
    setCarouselIndex((prev) => (prev - 1 + portfolio.length) % portfolio.length);
  };

  const nextAboutSlide = () => {
    setAboutCarouselIndex((prev) => (prev + 1) % aboutImages.length);
  };

  const prevAboutSlide = () => {
    setAboutCarouselIndex((prev) => (prev - 1 + aboutImages.length) % aboutImages.length);
  };

  const goToSlide = (index: number) => {
    setCarouselIndex(index);
  };

  const Particle = ({ index }: { index: number }) => {
    const randomX = Math.random() * 100;
    const randomY = Math.random() * 100;
    const randomDuration = 3 + Math.random() * 2;
    const randomSize = 2 + Math.random() * 4;

    return (
      <div
        className="absolute rounded-full bg-[#D9A66A] opacity-20"
        style={{
          width: `${randomSize}px`,
          height: `${randomSize}px`,
          left: `${randomX}%`,
          top: `${randomY}%`,
          animation: `float ${randomDuration}s ease-in-out infinite`,
          animationDelay: `${index * 0.1}s`,
        }}
      />
    );
  };

  const navBackground =
    scrollY > 50 ? "rgba(42, 9, 6, 0.65)" : "rgba(42, 9, 6, 0.95)";

  return (
    <div className="min-h-screen bg-[#140000] text-white overflow-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D9A66A] rounded-full opacity-5 blur-3xl animate-float" />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 bg-[#6e2317] rounded-full opacity-5 blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#E8C8A3] rounded-full opacity-3 blur-3xl animate-pulse-scale" />
      </div>

      {showParticles && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => (
            <Particle key={i} index={i} />
          ))}
        </div>
      )}

      <nav
        className="fixed top-0 w-full bg-[#2a0906] border-b-2 border-[#D9A66A] z-50 shadow-lg backdrop-blur-md animate-slide-down transition-colors duration-300"
        style={{ backgroundColor: navBackground }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer">
            <img
              src="/ícone-fundotransparente.png"
              alt="Ícone Belarmino Barbershop"
              className="w-10 h-10 drop-shadow-[0_0_10px_rgba(217,166,106,0.6)]"
            />
            <h1
              className="text-2xl font-bold text-[#D9A66A] group-hover:animate-neon-glow transition-all duration-300"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              BELARMINO
            </h1>
          </div>

          <ul className="hidden md:flex gap-6 text-sm font-semibold uppercase tracking-wider items-center">
            <li>
              <a href="#servicos" className="text-[#E8C8A3] hover:text-[#D9A66A] transition">
                Serviços
              </a>
            </li>
            <li>
              <a href="#portfolio" className="text-[#E8C8A3] hover:text-[#D9A66A] transition">
                Portfolio
              </a>
            </li>
            <li>
              <a href="#contato" className="text-[#E8C8A3] hover:text-[#D9A66A] transition">
                Contato
              </a>
            </li>
            <li>
              <Link href="/agendar" className="text-[#E8C8A3] hover:text-[#D9A66A] transition">
                Agendar
              </Link>
            </li>

            {!user ? (
              <li className="px-3 py-1 rounded-full border border-[#D9A66A]/30 text-xs text-neutral-300 normal-case">
                Não logado
              </li>
            ) : (
              <li className="flex items-center gap-3 normal-case">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#140000]/70 border border-[#D9A66A]/30">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "Usuário"}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-xs text-[#E8C8A3] max-w-28 truncate">
                    {user.displayName || user.email}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="text-xs text-red-300 hover:text-red-400 transition"
                >
                  Sair
                </button>
              </li>
            )}
          </ul>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#D9A66A] text-2xl hover:animate-rotate-360 transition-all duration-300"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#2a0906] border-t border-[#D9A66A] animate-slide-down">
            <div className="px-4 py-4 space-y-3">
              <a
                href="#servicos"
                onClick={handleMobileMenuClose}
                className="block text-[#E8C8A3] hover:text-[#D9A66A] transition py-2 font-semibold uppercase tracking-wider"
              >
                Serviços
              </a>

              <a
                href="#portfolio"
                onClick={handleMobileMenuClose}
                className="block text-[#E8C8A3] hover:text-[#D9A66A] transition py-2 font-semibold uppercase tracking-wider"
              >
                Portfolio
              </a>

              <a
                href="#contato"
                onClick={handleMobileMenuClose}
                className="block text-[#E8C8A3] hover:text-[#D9A66A] transition py-2 font-semibold uppercase tracking-wider"
              >
                Contato
              </a>

              <Link
                href="/agendar"
                onClick={handleMobileMenuClose}
                className="block text-[#E8C8A3] hover:text-[#D9A66A] transition py-2 font-semibold uppercase tracking-wider"
              >
                Agendar
              </Link>

              <div className="pt-3 border-t border-[#D9A66A]/20">
                {!user ? (
                  <div className="text-sm text-neutral-400">Não logado</div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {user.photoURL && (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || "Usuário"}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-[#E8C8A3] truncate">
                          {user.displayName || "Usuário logado"}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="text-sm text-red-300 hover:text-red-400"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleAgendarClick}
                className="w-full btn-retro cursor-pointer hover-lift transition-all-500 animate-pulse-scale mt-4"
              >
                Agendar
              </button>
            </div>
          </div>
        )}
      </nav>

      <section className="relative pt-32 pb-20 px-4 min-h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-[#060200] to-[#160400] opacity-95" />
          <div
            className="absolute inset-0 opacity-45 mix-blend-screen"
            style={{
              background:
                "radial-gradient(circle at 20% 25%, rgba(217,166,106,0.25), transparent 40%), radial-gradient(circle at 70% 15%, rgba(255,255,255,0.08), transparent 35%), radial-gradient(circle at 40% 80%, rgba(110,35,23,0.2), transparent 45%)",
            }}
          />

          {heroParticles.map((particle, index) => (
            <span
              key={`hero-particle-${index}`}
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

          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="mb-8 animate-fade-in-up">
            <img
              src="/belarmino-logo.png"
              alt="Belarmino Barbershop"
              className="mx-auto w-56 md:w-[26rem] drop-shadow-[0_0_25px_rgba(217,166,106,0.4)]"
            />
          </div>

          <p
            className="text-xl md:text-2xl text-[#E8C8A3] mb-8 animate-fade-in-up animate-color-shift"
            style={{ animationDelay: "0.2s" }}
          >
            Estilo Retrô, Qualidade Premium
          </p>

          <div
            className="w-24 h-1 bg-gradient-to-r from-transparent via-[#D9A66A] to-transparent mx-auto mb-12 animate-fade-in-up animate-shimmer"
            style={{ animationDelay: "0.4s" }}
          />

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
            style={{ animationDelay: "0.8s" }}
          >
            <button
              onClick={handleAgendarClick}
              className="btn-retro cursor-pointer hover-lift transition-all-500 animate-pulse-scale"
            >
              Agendar Agora
            </button>

            <button
              onClick={handleContatoClick}
              className="btn-retro-outline cursor-pointer hover-lift transition-all-500 hover:animate-border-glow"
            >
              Entre em Contato
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-wave">
          <div className="text-[#D9A66A] text-2xl">↓</div>
        </div>
      </section>

      <section id="servicos" className="py-20 px-4 bg-[#2a0906] relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-bold text-center mb-4 text-[#D9A66A] animate-fade-in-up text-shadow-gold"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Nossos Serviços
          </h2>

          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#D9A66A] to-transparent mx-auto mb-16 animate-shimmer" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                className="card-retro cursor-pointer transform transition-all duration-300 hover:scale-105 hover-lift animate-border-glow group"
                onClick={handleAgendarClick}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animation: "fadeInUp 0.8s ease-out forwards",
                }}
              >
                <div className="text-5xl mb-4 transition-all duration-300">
                  {service.icon}
                </div>

                <h3
                  className="text-xl font-bold text-[#D9A66A] mb-3 group-hover:animate-neon-glow"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {service.title}
                </h3>

                <p className="text-gray-300 text-sm mb-4 group-hover:text-[#E8C8A3] transition-colors">
                  {service.description}
                </p>

                <div className="pt-4 border-t border-[#6e2317] group-hover:border-[#D9A66A] transition-colors">
                  <p className="text-2xl font-bold text-[#E8C8A3] group-hover:animate-color-shift">
                    {service.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#140000] relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative overflow-hidden rounded-lg border-4 border-[#D9A66A] shadow-lg hover-glow transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#D9A66A] to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 z-10 pointer-events-none" />

              <div className="relative aspect-[4/3] w-full overflow-hidden">
                {aboutImages.map((image, index) => (
                  <img
                    key={image}
                    src={image}
                    alt={`Belarmino e esposa ${index + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                      index === aboutCarouselIndex ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={prevAboutSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center z-20 transition-colors"
                aria-label="Imagem anterior sobre"
              >
                ‹
              </button>

              <button
                onClick={nextAboutSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center z-20 transition-colors"
                aria-label="Próxima imagem sobre"
              >
                ›
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {aboutImages.map((_, index) => (
                  <span
                    key={index}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === aboutCarouselIndex ? "bg-[#D9A66A]" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="animate-fade-in-up">
              <h2
                className="text-4xl font-bold mb-6 text-[#D9A66A] text-shadow-gold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Sobre Belarmino
              </h2>

              <p className="text-gray-300 mb-4 leading-relaxed hover:text-[#E8C8A3] transition-colors">
                Há mais de 35 anos, a Barbearia Belarmino é referência em estilo e
                qualidade na região. Nossos barbeiros são profissionais experientes que
                combinam técnicas clássicas com tendências modernas.
              </p>

              <p className="text-gray-300 mb-6 leading-relaxed hover:text-[#E8C8A3] transition-colors">
                Cada cliente recebe atenção personalizada e um atendimento impecável.
                Utilizamos produtos premium e mantemos os mais altos padrões de higiene
                e profissionalismo.
              </p>

              <div className="flex gap-4">
                <div className="text-center group cursor-pointer">
                  <p className="text-3xl font-bold text-[#D9A66A] group-hover:animate-neon-glow transition-all">
                    35+
                  </p>
                  <p className="text-sm text-gray-400 group-hover:text-[#E8C8A3] transition-colors">
                    Anos de Experiência
                  </p>
                </div>

                <div className="text-center group cursor-pointer">
                  <p className="text-3xl font-bold text-[#D9A66A] group-hover:animate-neon-glow transition-all">
                    1000+
                  </p>
                  <p className="text-sm text-gray-400 group-hover:text-[#E8C8A3] transition-colors">
                    Clientes Satisfeitos
                  </p>
                </div>

                <div className="text-center group cursor-pointer">
                  <p className="text-3xl font-bold text-[#D9A66A] group-hover:animate-neon-glow transition-all">
                    5⭐
                  </p>
                  <p className="text-sm text-gray-400 group-hover:text-[#E8C8A3] transition-colors">
                    Avaliação
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
            {/* Portfolio Section - Carousel */}
      <section id="portfolio" className="py-20 px-4 bg-[#2a0906] relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-bold text-center mb-4 text-[#D9A66A]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Galeria de Trabalhos
          </h2>

          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#D9A66A] to-transparent mx-auto mb-16"></div>

          <div className="relative max-w-2xl mx-auto">
            <div className="relative overflow-hidden rounded-lg border-4 border-[#D9A66A] shadow-lg">
              <div className="aspect-square flex items-center justify-center overflow-hidden relative">
                {portfolio.map((item, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      index === carouselIndex ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#D9A66A] text-black rounded-full w-10 h-10 flex items-center justify-center"
              >
                ‹
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#D9A66A] text-black rounded-full w-10 h-10 flex items-center justify-center"
              >
                ›
              </button>
            </div>

            <div className="flex justify-center gap-3 mt-6">
              {portfolio.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full ${
                    index === carouselIndex
                      ? "bg-[#D9A66A] w-6"
                      : "bg-[#6e2317]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Barbearia */}
      <section className="py-20 px-4 bg-[#140000] relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-[#D9A66A]">
            Nossa Barbearia
          </h2>

          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#D9A66A] to-transparent mx-auto mb-12"></div>

          <div className="overflow-hidden rounded-lg border-4 border-[#D9A66A] shadow-lg">
            <img
              src="/barbearia.png"
              alt="Barbearia"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="py-20 px-4 bg-[#2a0906] relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 text-[#D9A66A]">
            Contato
          </h2>

          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#D9A66A] to-transparent mx-auto mb-12"></div>

          <p className="text-gray-300 mb-4">
            Clique abaixo para falar direto no WhatsApp
          </p>

          <button
            onClick={handleContatoClick}
            className="bg-[#D9A66A] text-black px-6 py-3 rounded-lg font-bold hover:opacity-90"
          >
            Falar no WhatsApp
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#140000] border-t border-[#D9A66A] py-6 text-center text-sm text-gray-400">
        © 2026 Barbearia Belarmino
      </footer>
    </div>
  );
}
