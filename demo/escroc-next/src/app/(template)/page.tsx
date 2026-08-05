import { About } from '@/components/homepage/About';
import { Banner } from '@/components/homepage/Banner';
import { Blog } from '@/components/homepage/Blog';
import { BrandSlider } from '@/components/homepage/BrandSlider';
import { DownloadApp } from '@/components/homepage/DownloadApp';
import { Expertise } from '@/components/homepage/Expertise';
import { Services } from '@/components/homepage/Services';
import { Testimonials } from '@/components/homepage/Testimonials';
import React from 'react';

const page = () => {
    return (
        <>
              <Banner />
              <BrandSlider />
              <About />
              <Services />
              <Expertise />
              <Testimonials />
              <Blog />
              <DownloadApp />
        </>
    );
};

export default page;