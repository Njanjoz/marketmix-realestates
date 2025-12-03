// src/styles/GlobalStyle.jsx - DEFINES GLOBAL FONT AND RESETS
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  /* CSS Reset (Modern browser normalization) */
  * {
    /* Ensures padding and border are included in the element's total width and height */
    box-sizing: border-box; 
    /* Remove default browser margins and padding */
    margin: 0;
    padding: 0;
  }
  
  /* Apply the Inter font globally and set base styles for the page */
  body {
    font-family: 'Inter', sans-serif;
    line-height: 1.5;
    /* Light gray background for contrast (Tailwind 'bg-gray-50' equivalent) */
    background-color: #f9fafb; 
    /* Default text color (Tailwind 'text-gray-800' equivalent) */
    color: #1f2937; 
    /* Smoother font rendering */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Base styling for typography */
  h1, h2, h3, h4, h5, h6 {
    line-height: 1.2;
    margin-bottom: 0.5rem;
    font-weight: 700;
  }
  
  /* Link styling reset */
  a {
    text-decoration: none; /* Remove underline */
    color: inherit; /* Inherit color from parent for consistency */
  }

  /* Image styling for better responsiveness */
  img {
    max-width: 100%;
    display: block;
  }
`;

export default GlobalStyle;