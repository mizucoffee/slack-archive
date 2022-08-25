export class User {
  id = "";
  name = "";
  display_name = "";

  constructor(id: string, name: string, display_name: string) {
    this.id = id;
    this.name = name;
    this.display_name = display_name;
  }
}
