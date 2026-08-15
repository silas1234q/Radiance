/**
 * Skin photography used by the `Plate` component.
 *
 * The source files ship with spaces and parentheses in their names, which makes
 * for awkward import specifiers — keeping them all in here means the rest of the
 * app imports a plain identifier and the filenames only have to be right once.
 */
import skin1 from './skin (1).jpg'
import skin2 from './skin (2).jpg'
import skin3 from './skin (3).jpg'
import skin4 from './skin (4).jpg'

export { skin1, skin2, skin3, skin4 }

/** All four, in order — handy for cycling across a list. */
export const skins = [skin1, skin2, skin3, skin4] as const
