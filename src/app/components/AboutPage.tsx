import React from "react";
import { Sparkles, MoonStar, Leaf } from "lucide-react";
import { motion } from "motion/react";

export const AboutPage = () => {
  return (
    <div className="bg-[#1A1817] min-h-[80vh] py-24 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#C19A5B]/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#C19A5B]/5 rounded-full blur-[100px]" />

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="flex items-center justify-center gap-4 mb-8 text-[#C19A5B]">
            <MoonStar size={20} />
            <h1 className="font-cinzel text-sm uppercase tracking-[0.3em]">Our Grimoire</h1>
            <Leaf size={20} />
          </div>
          
          <h2 className="font-cinzel text-5xl md:text-7xl text-[#F4EFE6] mb-12 drop-shadow-lg">
            The Lore of Velune
          </h2>
          
          <div className="space-y-8 font-lora text-[#A39E98] text-lg max-w-2xl mx-auto italic leading-relaxed text-left">
            <p className="first-letter:text-6xl first-letter:font-cinzel first-letter:text-[#C19A5B] first-letter:mr-2 first-letter:float-left">
              Deep within the ancient woodlands, where moonlight barely touches the forest floor, Velune was born. We are more than just a fragrance house; we are an apothecary dedicated to the old ways. 
            </p>
            <p>
              Our oil-based fragrances are crafted not just with scent in mind, but with intent. We believe that what you wear on your skin should carry a vibration, a memory, and a touch of magic. Each bottle is hand-poured during specific lunar phases to enhance the properties of the botanical extracts within.
            </p>
            <p>
              We source only the finest, ethically harvested resins, petals, and woods. Our cauldrons bubble with jojoba and sweet almond oils, steeping over time to draw out the truest essence of the earth.
            </p>
          </div>
          
          <div className="mt-20 inline-flex items-center justify-center p-6 border border-[#2A2624] bg-[#121110]">
            <Sparkles size={24} className="text-[#C19A5B] mr-4" />
            <p className="font-cinzel text-[#F4EFE6] text-xl">"Wear your magic."</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
