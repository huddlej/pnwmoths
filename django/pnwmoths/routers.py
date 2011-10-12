class MySqlRouter(object):
    """
    A router to control all database operations on models in the MySQL database.
    """
    app_labels = ["species"]

    def db_for_read(self, model, **hints):
        "Point all operations on selected models to 'pnwmoths'"
        if model._meta.app_label in self.app_labels:
            return 'pnwmoths'
        return None

    def db_for_write(self, model, **hints):
        "Point all operations on species models to 'pnwmoths'"
        if model._meta.app_label in self.app_labels:
            return 'pnwmoths'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        "Allow any relation if a model in species is involved"
        if obj1._meta.app_label in self.app_labels or obj2._meta.app_label in self.app_labels:
            return True
        return None

    def allow_syncdb(self, db, model):
        "Make sure the species app only appears on the 'pnwmoths' db"
        if db == 'pnwmoths':
            return model._meta.app_label in self.app_labels
        elif model._meta.app_label in self.app_labels:
            return False
        return None
