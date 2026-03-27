// src/components/StyledComponentsProvider.jsx
import React from 'react';
import { StyleSheetManager } from 'styled-components';

// List of valid HTML attributes that should always be passed through
const validHTMLAttributes = new Set([
  'className', 'class', 'id', 'href', 'target', 'rel', 'onClick', 'onChange',
  'onSubmit', 'onKeyDown', 'onKeyUp', 'onFocus', 'onBlur', 'onMouseEnter',
  'onMouseLeave', 'onMouseDown', 'onMouseUp', 'style', 'disabled', 'type',
  'value', 'placeholder', 'checked', 'selected', 'defaultValue', 'defaultChecked',
  'role', 'tabIndex', 'title', 'alt', 'src', 'width', 'height', 'htmlFor',
  'name', 'method', 'action', 'encType', 'accept', 'acceptCharset', 'multiple',
  'pattern', 'required', 'step', 'min', 'max', 'minLength', 'maxLength',
  'autoComplete', 'autoFocus', 'readOnly', 'spellCheck', 'draggable',
  'download', 'media', 'sandbox', 'scoped', 'shape', 'size', 'span', 'start',
  'summary', 'wrap', 'crossOrigin', 'form', 'formAction', 'formEncType',
  'formMethod', 'formNoValidate', 'formTarget', 'frameBorder', 'marginHeight',
  'marginWidth', 'scrolling', 'noValidate', 'seamless', 'allowFullScreen'
]);

export const StyledComponentsProvider = ({ children }) => {
  // ✅ FIX: Simplified shouldForwardProp function
  const shouldForwardProp = (propName) => {
    // Allow all props that start with $ (transient props)
    if (propName.startsWith('$')) {
      return true;
    }
    
    // Allow all valid HTML attributes
    if (validHTMLAttributes.has(propName)) {
      return true;
    }
    
    // Allow all aria-* and data-* attributes
    if (propName.startsWith('aria-') || propName.startsWith('data-')) {
      return true;
    }
    
    // Allow React-specific props
    if (['children', 'dangerouslySetInnerHTML', 'key', 'ref'].includes(propName)) {
      return true;
    }
    
    // Block all other props from reaching the DOM
    return false;
  };

  return (
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      {children}
    </StyleSheetManager>
  );
};