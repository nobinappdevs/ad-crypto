// "use client";

// import Image from "next/image";
// import { Swiper, SwiperSlide } from "swiper/react";
// import { Autoplay, FreeMode } from "swiper/modules";
// import "swiper/css";
// import "swiper/css/free-mode";

// const BRANDS = [
//   { name: "Brand 1", src: "/assets/brand/brand1.webp" },
//   { name: "Brand 2", src: "/assets/brand/brand2.webp" },
//   { name: "Brand 1", src: "/assets/brand/brand1.webp" },
//   { name: "Brand 2", src: "/assets/brand/brand2.webp" },
//   { name: "Brand 1", src: "/assets/brand/brand1.webp" },
//   { name: "Brand 2", src: "/assets/brand/brand2.webp" },
// ];

// export function BrandSlider() {
//   return (
//     <section className="relative isolate overflow-hidden mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 w-full">
//       <p className="mb-7 text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted/60">
//         Trusted by leading teams worldwide
//       </p>

//       <div className="brand-slider-mask">
//         <Swiper
//           modules={[Autoplay, FreeMode]}
//           slidesPerView="auto"
//           spaceBetween={0}
//           loop={true}
//           freeMode={true}
//           speed={4000}
//           allowTouchMove={true}
//           grabCursor={true}
//           autoplay={{
//             delay: 0,
//             disableOnInteraction: false,
//             pauseOnMouseEnter: true,
//           }}
//           className="brand-swiper"
//         >
//           {[...BRANDS, ...BRANDS].map(({ name, src }, i) => (
//             <SwiperSlide key={i} className="w-auto!">
//               <div className="flex items-center px-10   transition duration-300 hover:opacity-100 hover:grayscale-0">
//                 <Image
//                   src={src}
//                   alt={name}
//                   width={120}
//                   height={400}
//                   className="invert dark:invert-0"
//                 />
//               </div>
//             </SwiperSlide>
//           ))}
//         </Swiper>
//       </div>
//     </section>
//   );
// }

"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

const BRANDS = [
  { name: "Brand 1", src: "/assets/brand/brand1.webp" },
  { name: "Brand 2", src: "/assets/brand/brand2.webp" },
  { name: "Brand 3", src: "/assets/brand/brand3.webp" },
  { name: "Brand 4", src: "/assets/brand/brand4.webp" },
  { name: "Brand 5", src: "/assets/brand/brand5.webp" },
  { name: "Brand 1", src: "/assets/brand/brand1.webp" },
];

export function BrandSlider() {
  return (
    // `overflow-hidden` + a fixed slide count only from `lg` up — Swiper's track
    // is as wide as slidesPerView demands, and 5 un-shrinkable logos never fit
    // a phone's width, which was blowing out the whole page's horizontal scroll.
    <section className="mx-auto w-full max-w-7xl overflow-hidden px-4 py-10 sm:px-6">
      <Swiper
        modules={[Autoplay]}
        slidesPerView={2}
        spaceBetween={16}
        breakpoints={{
          480: { slidesPerView: 3, spaceBetween: 20 },
          768: { slidesPerView: 4, spaceBetween: 24 },
          1024: { slidesPerView: 5, spaceBetween: 32 },
        }}
        loop
        speed={800}
        autoplay={{
          delay: 2000, // 2 sec pause
          disableOnInteraction: false,
        }}
      >
        {BRANDS.map(({ name, src }, i) => (
          <SwiperSlide key={i}>
            <div className="flex justify-center">
              <Image
                src={src}
                alt={name}
                width={120}
                height={60}
                style={{ width: "auto", height: "auto" }}
                className="max-h-10 invert dark:invert-0"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}