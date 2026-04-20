import React from "react";
import { Link, Outlet } from "react-router";
import { ShoppingBag, MoonStar, Leaf } from "lucide-react";
import { useCauldron } from "./CauldronContext";

// Make sure to import the logo properly
import logo from "../../imports/Velune.pk_(1).png";

export const Layout = () => {
  const { totalItems } = useCauldron();

  return (
    <div className="min-h-screen bg-[#1A1817] text-[#F4EFE6] font-lora selection:bg-[#C19A5B] selection:text-[#1A1817]">
      {/* Mystical Top Bar */}
      

      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-[#2A2624] bg-[#425942]">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between bg-[#425942]">
          <nav className="hidden md:flex items-center gap-8 font-cinzel text-sm tracking-widest">
            <Link to="/" className="hover:text-[#C19A5B] transition-colors text-[#ffffff]">Apothecary</Link>
            <Link to="/about" className="hover:text-[#C19A5B] transition-colors text-[#ffffff]">Our Grimoire</Link>
          </nav>

          <Link to="/" className="flex items-center justify-center flex-1 md:flex-none">
            {/* Logo goes here */}
            <span className="font-cinzel tracking-[0.2em] uppercase font-bold text-[36px] text-left font-[Eagle_Lake] relative right-4 md:right-[3.5rem] text-[#ffffff]">Velune</span>
          </Link>

          <div className="flex items-center justify-end gap-6 flex-1 md:flex-none">
            <Link to="/cauldron" className="relative hover:text-[#C19A5B] transition-colors flex items-center gap-2 font-cinzel text-sm">
              <span className="hidden md:inline uppercase tracking-widest text-[#ffffff]">Cauldron</span>
              <div className="relative">
                <ShoppingBag size={24} className="opacity-90 bg-[#36ff6500]" />
                {totalItems > 0 && (
                  <span className="absolute -bottom-2 -right-2 bg-[#C19A5B] text-[#1A1817] text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                    {totalItems}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="bg-[#121110] border-t border-[#2A2624] py-16 mt-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-sm text-[#A39E98]">
          <div className="space-y-4">
            <img src={logo} alt="Velune Logo" className="h-12 object-contain opacity-70 grayscale" />
            <p className="max-w-xs">
              Hand-poured, oil-based fragrances brewed with intention and magic in our woodland apothecary.
            </p>
          </div>
          <div>
            <h4 className="font-cinzel text-[#F4EFE6] text-lg mb-6">Explore</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="hover:text-[#C19A5B]">The Apothecary</Link></li>
              <li><Link to="#" className="hover:text-[#C19A5B]">Our Process</Link></li>
              <li><Link to="#" className="hover:text-[#C19A5B]">Sourcing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-cinzel text-[#F4EFE6] text-lg mb-6">Join the Coven</h4>
            <p className="mb-4">Subscribe to our newsletter for moon phases, new brews, and secret potions.</p>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="bg-[#1A1817] border border-[#2A2624] px-4 py-2 w-full focus:outline-none focus:border-[#C19A5B] text-[#F4EFE6]"
              />
              <button className="bg-[#0A3600] px-4 font-cinzel uppercase text-xs tracking-wider font-bold hover:bg-[#115500] transition-colors text-white">
                Join
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-[#2A2624] flex flex-col md:flex-row items-center justify-between text-xs">
          <p>© 2026 Velune Apothecary. All rights reserved.</p>
          <div className="flex gap-2 mt-4 md:mt-0 opacity-50">
            <Leaf size={14} /> <MoonStar size={14} />
          </div>
        </div>
      </footer>
    </div>
  );
};
