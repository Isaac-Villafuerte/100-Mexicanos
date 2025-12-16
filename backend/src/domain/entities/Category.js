export class Category {
  constructor({ id, name, description, isActive = true }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.isActive = isActive;
  }

  static create(data) {
    return new Category(data);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      isActive: this.isActive
    };
  }
}
