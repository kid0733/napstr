export const colors = {
	background: '#000',
	title: '#90a955',
	text: '#d6ce93',
	// Green theme
	greenPrimary: '#90a955',
	greenSecondary: '#7da647',
	greenTertiary: '#dde5b6',
	// Red theme
	redPrimary: '#e63946',
	redSecondary: '#ff6b6b',
	redTertiary: '#ffccd5',
	// Blue theme
	bluePrimary: '#457b9d',
	blueSecondary: '#219ebc',
	blueTertiary: '#a8dadc',
	// Purple theme
	purplePrimary: '#7b2cbf',
	purpleSecondary: '#9d4edd',
	purpleTertiary: '#c77dff',
	// Orange theme
	orangePrimary: '#fb8500',
	orangeSecondary: '#ffb703',
	orangeTertiary: '#ffd60a',
}

export const fontSize = {
	// Display sizes
	display1: 48,
	display2: 40,
	display3: 32,
	// Heading sizes
	h1: 28,
	h2: 24,
	h3: 20,
	h4: 18,
	h5: 16,
	h6: 14,
	// Body sizes
	bodyLarge: 16,
	bodyMedium: 14,
	bodySmall: 12,
	// Special sizes
	caption: 11,
	overline: 10,
	button: 14,
	label: 12,
}

export const fontFamily = {
	// Display & Heading font
	title: 'Title',
	// Dosis font family
	extraLight: 'dosis_extra-light',
	light: 'dosis_light',
	book: 'dosis_book',
	medium: 'dosis_medium',
	semiBold: 'dosis_semi-bold',
	bold: 'dosis_bold',
	extraBold: 'dosis_extra-bold',
}

export const fontWeight = {
	regular: {
		normal: 'text_regular',
		italic: 'text_italic',
	},
	bold: {
		normal: 'text_bold',
		italic: 'text_bold-italic',
	},
	black: {
		normal: 'text_black',
		italic: 'text_black-italic',
	},
}

export const typography = {
	// Display styles
	display1: {
		fontFamily: fontFamily.title,
		fontSize: fontSize.display1,
	},
	display2: {
		fontFamily: fontFamily.title,
		fontSize: fontSize.display2,
	},
	display3: {
		fontFamily: fontFamily.title,
		fontSize: fontSize.display3,
	},
	
	// Heading styles
	h1: {
		fontFamily: fontFamily.title,
		fontSize: fontSize.h1,
	},
	h2: {
		fontFamily: fontFamily.title,
		fontSize: fontSize.h2,
	},
	h3: {
		fontFamily: fontFamily.title,
		fontSize: fontSize.h3,
	},
	h4: {
		fontFamily: fontFamily.semiBold,
		fontSize: fontSize.h4,
	},
	h5: {
		fontFamily: fontFamily.semiBold,
		fontSize: fontSize.h5,
	},
	h6: {
		fontFamily: fontFamily.semiBold,
		fontSize: fontSize.h6,
	},

	// Body styles
	bodyLarge: {
		regular: {
			fontFamily: fontFamily.book,
			fontSize: fontSize.bodyLarge,
		},
		medium: {
			fontFamily: fontFamily.medium,
			fontSize: fontSize.bodyLarge,
		},
		semiBold: {
			fontFamily: fontFamily.semiBold,
			fontSize: fontSize.bodyLarge,
		},
		bold: {
			fontFamily: fontFamily.bold,
			fontSize: fontSize.bodyLarge,
		},
	},
	bodyMedium: {
		regular: {
			fontFamily: fontFamily.book,
			fontSize: fontSize.bodyMedium,
		},
		medium: {
			fontFamily: fontFamily.medium,
			fontSize: fontSize.bodyMedium,
		},
		semiBold: {
			fontFamily: fontFamily.semiBold,
			fontSize: fontSize.bodyMedium,
		},
		bold: {
			fontFamily: fontFamily.bold,
			fontSize: fontSize.bodyMedium,
		},
	},
	bodySmall: {
		regular: {
			fontFamily: fontFamily.book,
			fontSize: fontSize.bodySmall,
		},
		medium: {
			fontFamily: fontFamily.medium,
			fontSize: fontSize.bodySmall,
		},
		semiBold: {
			fontFamily: fontFamily.semiBold,
			fontSize: fontSize.bodySmall,
		},
		bold: {
			fontFamily: fontFamily.bold,
			fontSize: fontSize.bodySmall,
		},
	},

	// Special styles
	caption: {
		regular: {
			fontFamily: fontFamily.light,
			fontSize: fontSize.caption,
		},
		medium: {
			fontFamily: fontFamily.medium,
			fontSize: fontSize.caption,
		},
	},
	overline: {
		semiBold: {
			fontFamily: fontFamily.semiBold,
			fontSize: fontSize.overline,
			textTransform: 'uppercase' as const,
		},
	},
	button: {
		fontFamily: fontFamily.bold,
		fontSize: fontSize.button,
		textTransform: 'uppercase' as const,
	},
	label: {
		regular: {
			fontFamily: fontFamily.book,
			fontSize: fontSize.label,
		},
		medium: {
			fontFamily: fontFamily.medium,
			fontSize: fontSize.label,
		},
	},
}
