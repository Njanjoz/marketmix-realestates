// src/components/Footer.jsx - STYLED COMPONENTS VERSION
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Home } from 'lucide-react';
import './moving/LiquidGlass.css';

// --- COLOR AND STYLE CONSTANTS ---
// Defining these locally until a central theme file is implemented
const PRIMARY_COLOR = '#16845e';
const PRIMARY_DARK = '#115b43';
const GRAY_400 = '#475c53';
const GRAY_500 = '#64746c';
const WHITE = '#ffffff';

// --- STYLED COMPONENTS DEFINITIONS ---

const FooterWrapper = styled.footer`
  position: relative;
  border-top: 1px solid rgba(255, 255, 255, 0.78);
  color: #17382d;
`;

const FooterSection = styled.div`
  max-width: 1280px; /* max-w-7xl / container mx-auto */
  margin-left: auto;
  margin-right: auto;
  padding: 3rem 1rem; /* py-12 / px-4 */

  @media (min-width: 1024px) {
    padding: 4rem 1.5rem; /* lg:py-16 / lg:px-6 */
  }
`;

const CompanyLogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem; /* space-x-3 */
  margin-bottom: 1rem; /* space-y-4 for overall section */
`;

const LogoIcon = styled.div`
  /* bg-gradient-to-br from-primary-500 to-primary-700 */
  background: linear-gradient(to bottom right, ${PRIMARY_COLOR}, ${PRIMARY_DARK});
  padding: 0.5rem; /* p-2 */
  border-radius: 0.5rem; /* rounded-lg */
`;

const MainTitle = styled.h3`
  font-size: 1.5rem; /* text-2xl */
  font-weight: 700; /* font-bold */
  /* bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent */
  background-image: linear-gradient(to right, #174b37, #16845e 60%, #247990);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent; /* Fallback */
`;

const Subtitle = styled.p`
  font-size: 0.75rem; /* text-xs */
  color: #64746c;
  letter-spacing: 0.05em; /* tracking-wider */
`;

const SocialLink = styled.a`
  color: ${GRAY_500};
  transition: color 150ms;
  &:hover {
    color: ${PRIMARY_DARK};
  }
`;

const FooterLink = styled(Link)`
  color: ${GRAY_400};
  transition: color 150ms;
  &:hover {
    color: ${PRIMARY_DARK};
  }
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem; /* space-x-3 */
  color: ${GRAY_400};
  font-size: 0.875rem; /* text-sm */
  
  svg {
    color: ${PRIMARY_COLOR};
  }
`;

const NewsletterForm = styled.div`
  display: flex;
  width: 100%;
  margin-top: 1rem;
`;

const NewsletterInput = styled.input`
  flex-grow: 1;
  padding: 0.75rem 1rem; /* p-3 */
  border-top-left-radius: 0.5rem;
  border-bottom-left-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.62);
  color: #17382d;
  border: 1px solid rgba(255, 255, 255, 0.86);
  transition: border-color 150ms;

  &::placeholder {
    color: #64746c;
  }
  
  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
  }
`;

const NewsletterButton = styled.button`
  /* bg-gradient-to-r from-primary-600 to-primary-700 */
  background: linear-gradient(to right, ${PRIMARY_COLOR}, ${PRIMARY_DARK});
  padding: 0.75rem 1rem; /* px-4 py-3 */
  border-top-right-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
  transition: background 300ms;
  
  &:hover {
    /* hover:from-primary-700 hover:to-primary-800 */
    background: linear-gradient(to right, ${PRIMARY_DARK}, #075985);
  }

  svg {
    color: ${WHITE};
  }
`;

const BottomBar = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.72);
  margin-top: 3rem; /* mt-12 */
  padding-top: 2rem; /* pt-8 */
`;

const BottomBarText = styled.p`
  color: #64746c;
  font-size: 0.875rem; /* text-sm */
`;


const Footer = () => {
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Properties', path: '/properties' },
    { name: 'Agents', path: '/agents' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];
  
  const resourcesLinks = [
    { name: 'Mortgage Calculator', path: '/mortgage' },
    { name: 'Blog & News', path: '/blog' },
    { name: 'Testimonials', path: '/testimonials' },
    { name: 'List Your Property', path: '/dashboard?tab=listings' },
  ];

  return (
    <FooterWrapper className="mmx-liquid-canvas">
      {/* Main Footer */}
      <FooterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="mmx-glass-surface rounded-3xl p-5 sm:p-6 space-y-4">
            <CompanyLogoContainer>
              <LogoIcon>
                <Home className="w-6 h-6 text-white" />
              </LogoIcon>
              <div>
                <MainTitle>
                  MarketMix
                </MainTitle>
                <Subtitle>REAL ESTATES</Subtitle>
              </div>
            </CompanyLogoContainer>
            
            <p className="text-sm text-slate-600 max-w-xs">
              Your trusted partner in finding the perfect property. Dedicated to excellence in real estate.
            </p>
            
            <div className="flex space-x-4 pt-2">
              <SocialLink href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                <Facebook className="w-6 h-6" />
              </SocialLink>
              <SocialLink href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                <Twitter className="w-6 h-6" />
              </SocialLink>
              <SocialLink href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <Instagram className="w-6 h-6" />
              </SocialLink>
              <SocialLink href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <Linkedin className="w-6 h-6" />
              </SocialLink>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mmx-glass-surface rounded-3xl p-5 sm:p-6">
            <h4 className="text-lg font-bold mb-5 text-slate-900">Quick Links</h4>
            <div className="space-y-3">
              {navLinks.map((link) => (
                <div key={link.name}>
                  <FooterLink to={link.path}>
                    {link.name}
                  </FooterLink>
                </div>
              ))}
            </div>
          </div>
          
          {/* Contact Info & Resources */}
          <div className="mmx-glass-surface rounded-3xl p-5 sm:p-6">
            <h4 className="text-lg font-bold mb-5 text-slate-900">Contact & Resources</h4>
            <div className="space-y-4">
              <ContactItem as="a" href="tel:0115988107">
                <Phone className="w-5 h-5" />
                0115988107
              </ContactItem>
              <ContactItem as="a" href="mailto:marketmixkenya@gmail.com">
                <Mail className="w-5 h-5" />
                marketmixkenya@gmail.com
              </ContactItem>
              <ContactItem>
                <MapPin className="w-5 h-5" />
                Westlands, Nairobi, Kenya
              </ContactItem>
              <div className="pt-2 space-y-3">
                {resourcesLinks.map((link) => (
                  <div key={link.name}>
                    <FooterLink to={link.path}>
                      {link.name}
                    </FooterLink>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="mmx-glass-surface rounded-3xl p-5 sm:p-6">
            <h4 className="text-lg font-bold mb-5 text-slate-900">Stay Updated</h4>
            <p className="text-sm text-slate-600">
              Subscribe to our newsletter for the latest market insights.
            </p>
            <NewsletterForm>
              <NewsletterInput
                type="email"
                placeholder="Enter your email"
              />
              <NewsletterButton>
                <Mail className="w-5 h-5" />
              </NewsletterButton>
            </NewsletterForm>
            <p className="text-xs text-slate-500 mt-2">
              Get weekly property updates and exclusive deals
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <BottomBar>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <BottomBarText>
              &#169; {currentYear} MarketMix Real Estates. All rights reserved.
            </BottomBarText>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <FooterLink to="/privacy">
                Privacy Policy
              </FooterLink>
              <FooterLink to="/terms">
                Terms of Service
              </FooterLink>
              <FooterLink to="/cookies">
                Cookies
              </FooterLink>
            </div>
          </div>
        </BottomBar>
      </FooterSection>
    </FooterWrapper>
  );
};

export default Footer;
