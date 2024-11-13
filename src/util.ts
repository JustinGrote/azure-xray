/**
 * Fixes chrome-extension paths brought in by plasmo URI handling
 * @see https://github.com/PlasmoHQ/plasmo/issues/106#issuecomment-1188539625
 * @param path
 */
export function fixChromePath (path: string) {
	console.log(path)
	return path?.startsWith("chrome-extension:") ? path.split("/").pop() : path
}