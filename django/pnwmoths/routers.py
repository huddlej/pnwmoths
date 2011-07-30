class SpeciesRouter(object):
    """
    A router to control all database operations on models in the species
    application.
    """
    def db_for_read(self, model, **hints):
        "Point all operations on species models to 'pnwmoths'"
        if model._meta.app_label == 'species':
            return 'pnwmoths'
        return None

    def db_for_write(self, model, **hints):
        "Point all operations on species models to 'pnwmoths'"
        if model._meta.app_label == 'species':
            return 'pnwmoths'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        "Allow any relation if a model in species is involved"
        if obj1._meta.app_label == 'species' or obj2._meta.app_label == 'species':
            return True
        return None

    def allow_syncdb(self, db, model):
        "Make sure the species app only appears on the 'pnwmoths' db"
        if db == 'pnwmoths':
            return model._meta.app_label == 'species'
        elif model._meta.app_label == 'species':
            return False
        return None
