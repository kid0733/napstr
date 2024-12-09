import { colors, typography } from '@/constants/tokens'
import { StyleSheet } from 'react-native'

export const styles = StyleSheet.create({
	// Layout styles
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	centerContent: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	spaceBetween: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},

	// Typography styles
	title: {
		...typography.h1,
		color: colors.greenPrimary,
	},
	subtitle: {
		...typography.h3,
		color: colors.greenSecondary,
	},
	text: {
		...typography.bodyMedium.regular,
		color: colors.text,
	},
	textMedium: {
		...typography.bodyMedium.medium,
		color: colors.text,
	},
	textSemiBold: {
		...typography.bodyMedium.semiBold,
		color: colors.text,
	},
	textBold: {
		...typography.bodyMedium.bold,
		color: colors.text,
	},
	textSmall: {
		...typography.bodySmall.regular,
		color: colors.text,
	},
	caption: {
		...typography.caption.regular,
		color: colors.text,
	},

	// Card styles
	card: {
		backgroundColor: '#1A1A1A',
		borderRadius: 12,
		padding: 16,
		marginVertical: 8,
		marginHorizontal: 16,
	},
	cardTitle: {
		...typography.h4,
		color: colors.greenPrimary,
		marginBottom: 8,
	},
	cardContent: {
		...typography.bodyMedium.regular,
		color: colors.text,
	},

	// Button styles
	button: {
		backgroundColor: colors.greenPrimary,
		borderRadius: 8,
		paddingVertical: 12,
		paddingHorizontal: 24,
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonText: {
		...typography.button,
		color: colors.background,
	},
	buttonOutline: {
		backgroundColor: 'transparent',
		borderWidth: 1,
		borderColor: colors.greenPrimary,
	},
	buttonOutlineText: {
		...typography.button,
		color: colors.greenPrimary,
	},

	// Input styles
	input: {
		backgroundColor: '#1A1A1A',
		borderRadius: 8,
		paddingVertical: 12,
		paddingHorizontal: 16,
		color: colors.text,
		...typography.bodyMedium.regular,
	},
	inputLabel: {
		...typography.label.medium,
		color: colors.greenSecondary,
		marginBottom: 8,
	},

	// List styles
	listItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#1A1A1A',
	},
	listItemTitle: {
		...typography.bodyLarge.semiBold,
		color: colors.text,
	},
	listItemSubtitle: {
		...typography.bodySmall.regular,
		color: colors.greenSecondary,
	},

	// Icon styles
	icon: {
		width: 24,
		height: 24,
		tintColor: colors.text,
	},
	iconSmall: {
		width: 16,
		height: 16,
		tintColor: colors.text,
	},
	iconLarge: {
		width: 32,
		height: 32,
		tintColor: colors.text,
	},

	// Spacing
	padding: {
		padding: 16,
	},
	paddingHorizontal: {
		paddingHorizontal: 16,
	},
	paddingVertical: {
		paddingVertical: 16,
	},
	margin: {
		margin: 16,
	},
	marginHorizontal: {
		marginHorizontal: 16,
	},
	marginVertical: {
		marginVertical: 16,
	},

	// Player specific styles
	playerControls: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-evenly',
		paddingVertical: 20,
	},
	progressBar: {
		height: 4,
		backgroundColor: '#1A1A1A',
		borderRadius: 2,
	},
	progressFill: {
		height: '100%',
		backgroundColor: colors.greenPrimary,
		borderRadius: 2,
	},
	albumArt: {
		width: 300,
		height: 300,
		borderRadius: 8,
		marginBottom: 24,
	},
	songTitle: {
		...typography.h2,
		color: colors.greenPrimary,
		textAlign: 'center',
		marginBottom: 8,
	},
	artistName: {
		...typography.bodyLarge.medium,
		color: colors.greenSecondary,
		textAlign: 'center',
		marginBottom: 24,
	},

	// Navigation styles
	tabBar: {
		backgroundColor: '#1A1A1A',
		borderTopWidth: 0,
		paddingBottom: 8,
		height: 60,
	},
	tabBarLabel: {
		...typography.caption.regular,
		marginBottom: 4,
	},

	// Modal styles
	modal: {
		backgroundColor: colors.background,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 20,
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 20,
	},
	modalTitle: {
		...typography.h3,
		color: colors.greenPrimary,
	},
})