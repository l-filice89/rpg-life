export function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/profile')) {
    return 'My Profile';
  }

  if (pathname.startsWith('/quest-board')) {
    return 'Quest Board';
  }

  return 'Quest Board';
}
