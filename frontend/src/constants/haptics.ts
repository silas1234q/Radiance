import  * as Haptics from 'expo-haptics';


export const triggerHapticFeedback = async (type: 'impact' | 'notification' | 'selection') => {
  try {
    switch (type) {
        case 'impact':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;          
        case 'notification':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
        case 'selection':
            await Haptics.selectionAsync();
            break;
        default:
            console.warn(`Unknown haptic feedback type: ${type}`);
    }
    } catch (error) {
        console.error('Error triggering haptic feedback:', error);
    }
}   
